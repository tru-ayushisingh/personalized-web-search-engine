# backend/app.py
import uuid
import json
import bleach
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from models import Session as DBSession, UserProfile, ClickLog
from search_service import fetch_results
from ranker import rank_results
from profile_manager import update_profile, get_top_interests
from location_service import get_city_from_coords

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY

# Allow React (port 3000) to talk to Flask (port 5000)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True)

# Rate limiter: max 30 requests/minute per IP address
limiter = Limiter(get_remote_address, app=app, default_limits=["30/minute"])


# ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

def get_or_create_session() -> str:
    """Return existing session ID or create a new one."""
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    return session["session_id"]


def get_user_profile(db_session, session_id: str) -> UserProfile:
    """Fetch UserProfile from DB, creating it if it doesn't exist."""
    profile = db_session.query(UserProfile).filter_by(session_id=session_id).first()
    if not profile:
        profile = UserProfile(session_id=session_id)
        db_session.add(profile)
        db_session.commit()
    return profile


# ─── SEARCH ENDPOINT ──────────────────────────────────────────────────────────

@app.route("/")
def home():
    return "Personalized Search Backend is running."


@app.route("/api/search", methods=["POST"])
@limiter.limit("30/minute")
def search():
    data = request.get_json(silent=True)
    if not data or "query" not in data:
        return jsonify({"error": "Missing required field: query"}), 400

    # Clean the query to remove any harmful HTML/scripts
    raw_query = bleach.clean(str(data["query"]).strip(), strip=True)
    if not raw_query or len(raw_query) > 300:
        return jsonify({"error": "Invalid query length"}), 400

    lat = data.get("lat")
    lng = data.get("lng")

    # Get city name from coordinates if provided
    location_info = {"city": "", "region": "", "country": "", "display_name": ""}
    if lat is not None and lng is not None:
        try:
            location_info = get_city_from_coords(float(lat), float(lng))
        except (ValueError, TypeError):
            pass  # if location fails, continue without it

    city = location_info.get("city", "")

    # Fetch raw results from Google
    try:
        results = fetch_results(raw_query, location_hint=city)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 502

    # Load user profile from database
    session_id = get_or_create_session()
    db_session = DBSession()

    try:
        user_profile = get_user_profile(db_session, session_id)
        # profile_vector is stored as JSON string, convert to dict
        profile_vec = json.loads(user_profile.profile_vector or "{}")

        # Re-rank results using profile + location
        ranked_results = rank_results(results, profile_vec, city)
    finally:
        db_session.close()

    return jsonify({
        "results":  ranked_results,
        "location": location_info,
        "query":    raw_query
    })


# ─── CLICK TRACKING ENDPOINT ──────────────────────────────────────────────────

@app.route("/api/click", methods=["POST"])
def record_click():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing body"}), 400

    session_id = get_or_create_session()
    db_session = DBSession()

    try:
        # Save click to database
        click = ClickLog(
            session_id     = session_id,
            query          = bleach.clean(data.get("query", ""), strip=True),
            result_url     = bleach.clean(data.get("url", ""), strip=True),
            result_title   = bleach.clean(data.get("title", ""), strip=True),
            result_snippet = bleach.clean(data.get("snippet", ""), strip=True),
        )
        db_session.add(click)

        # Update the user's interest profile
        clicked_text = f"{data.get('title', '')} {data.get('snippet', '')}"
        user_profile = get_user_profile(db_session, session_id)

        # Load existing profile vector (JSON string → dict)
        old_vec = json.loads(user_profile.profile_vector or "{}")

        # Update profile with new click data
        new_vec = update_profile(old_vec, clicked_text)

        # Save updated profile vector back (dict → JSON string)
        user_profile.profile_vector = json.dumps(new_vec)
        db_session.commit()

    finally:
        db_session.close()

    return jsonify({"status": "ok"})


# ─── PROFILE ENDPOINTS ────────────────────────────────────────────────────────

@app.route("/api/profile", methods=["GET"])
def get_profile():
    session_id = get_or_create_session()
    db_session = DBSession()

    try:
        user_profile  = get_user_profile(db_session, session_id)
        profile_vec   = json.loads(user_profile.profile_vector or "{}")
        top_interests = get_top_interests(profile_vec, n=15)
    finally:
        db_session.close()

    return jsonify({
        "session_id":  session_id,
        "interests":   top_interests,
        "total_terms": len(top_interests)
    })


@app.route("/api/profile", methods=["DELETE"])
def reset_profile():
    session_id = get_or_create_session()
    db_session = DBSession()

    try:
        user_profile = get_user_profile(db_session, session_id)
        user_profile.profile_vector = "{}"
        db_session.commit()
    finally:
        db_session.close()

    return jsonify({"status": "profile cleared"})


# ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)