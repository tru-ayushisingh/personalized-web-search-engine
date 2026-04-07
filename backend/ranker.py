# backend/ranker.py
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from config import Config
import numpy as np

def rank_results(
    results: list[dict],
    user_profile_terms: dict,
    city: str = ""
) -> list[dict]:
    """
    Re-rank search results using TF-IDF cosine similarity against user profile.

    Args:
        results:            Raw results from search_service.fetch_results()
        user_profile_terms: User's interest profile as {term: weight}
        city:               Detected city name for location boosting

    Returns:
        Re-ranked list of result dicts with added 'score' and 'location_match' keys
    """
    if not results:
        return results

    # Build document corpus: one string per result
    documents = [f"{r['title']} {r['snippet']}" for r in results]

    city_lower = city.lower()

    # ── COLD START: no profile yet ──────────────────────────────────────────
    # New user has no clicks yet — return original order but still apply
    # location boost so location feature works from the very first search
    if not user_profile_terms:
        for i, result in enumerate(results):
            location_boost = 0.0
            if city_lower and city_lower in (
                result["title"].lower() + " " + result["snippet"].lower()
            ):
                location_boost = Config.LOCATION_BOOST_WEIGHT

            # 1/(i+1) gives decreasing scores: 1.0, 0.5, 0.33, 0.25 ...
            result["score"]          = (1.0 / (i + 1)) + location_boost
            result["location_match"] = location_boost > 0
        return results

    # ── BUILD PROFILE DOCUMENT ───────────────────────────────────────────────
    # Convert profile dict to weighted bag-of-words string
    # e.g. {"pizza": 0.8, "restaurant": 0.5} →  "pizza pizza pizza ... restaurant restaurant ..."
    # Repeating words makes TF-IDF treat them as more important
    profile_doc = " ".join(
        f"{term} " * max(1, round(weight * 10))
        for term, weight in user_profile_terms.items()
    )

    # ── TF-IDF VECTORIZATION ─────────────────────────────────────────────────
    # Fit on all result documents + profile document together
    corpus = documents + [profile_doc]

    vectorizer = TfidfVectorizer(
        stop_words="english",   # ignore "the", "is", "in" etc.
        max_features=5000,      # keep only top 5000 most important words
        ngram_range=(1, 2),     # single words AND two-word phrases
        sublinear_tf=True       # use log(1 + TF) to reduce impact of very frequent words
    )

    tfidf_matrix = vectorizer.fit_transform(corpus)

    # Last row = profile vector, all other rows = result document vectors
    profile_vector = tfidf_matrix[-1]
    doc_matrix     = tfidf_matrix[:-1]

    # ── COSINE SIMILARITY ────────────────────────────────────────────────────
    # How similar is each result to the user's interests? (0.0 to 1.0)
    similarities = cosine_similarity(profile_vector, doc_matrix)[0]

    # ── SCORING + LOCATION BOOST ─────────────────────────────────────────────
    for i, result in enumerate(results):
        base_score     = float(similarities[i])
        location_boost = 0.0

        if city_lower and city_lower in (
            result["title"].lower() + " " + result["snippet"].lower()
        ):
            location_boost = Config.LOCATION_BOOST_WEIGHT

        result["score"]          = base_score + location_boost
        result["location_match"] = location_boost > 0

    # ── SORT BY FINAL SCORE ───────────────────────────────────────────────────
    results.sort(key=lambda r: r["score"], reverse=True)
    return results