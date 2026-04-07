# backend/profile_manager.py
from sklearn.feature_extraction.text import TfidfVectorizer
from config import Config

def update_profile(
    current_profile: dict,
    clicked_text: str
) -> dict:
    """
    Update user profile when a result is clicked.
    Uses exponential moving average to decay old interests.

    Args:
        current_profile: Existing {term: weight} profile dict
        clicked_text:    Title + snippet of the clicked result

    Returns:
        Updated and normalized profile dict
    """
    # Step 1: Extract TF-IDF features from the clicked document
    vectorizer = TfidfVectorizer(
        stop_words="english",   # remove common words like "the", "is"
        max_features=1000,      # keep top 1000 most meaningful words
        ngram_range=(1, 2),     # single words and two-word phrases
        sublinear_tf=True       # log scaling for word frequencies
    )

    try:
        tfidf_matrix  = vectorizer.fit_transform([clicked_text])
        feature_names = vectorizer.get_feature_names_out()
        scores        = tfidf_matrix.toarray()[0]

        # Build a dict of {word: importance_score} from this click
        clicked_vector = {
            feature_names[i]: float(scores[i])
            for i in range(len(feature_names))
            if scores[i] > 0
        }
    except ValueError:
        # Happens when clicked_text is empty after removing stop words
        return current_profile

    alpha = Config.PROFILE_DECAY  # 0.8 — how much old interests are kept

    # Step 2: Merge old profile with new click using exponential moving average
    # Formula: new_weight = 0.8 * old_weight + 0.2 * new_weight
    all_terms   = set(current_profile.keys()) | set(clicked_vector.keys())
    new_profile = {}

    for term in all_terms:
        old_weight    = current_profile.get(term, 0.0)
        new_weight    = clicked_vector.get(term, 0.0)
        merged_weight = alpha * old_weight + (1 - alpha) * new_weight

        # Prune terms with negligible weight to keep profile clean
        if merged_weight > 0.001:
            new_profile[term] = merged_weight

    # Step 3: Normalize all weights to [0, 1] range
    if new_profile:
        max_w       = max(new_profile.values())
        new_profile = {t: w / max_w for t, w in new_profile.items()}

    return new_profile


def get_top_interests(profile: dict, n: int = 10) -> list[dict]:
    """
    Return top-N terms from user profile for display in the frontend.

    Returns list of dicts instead of tuples so React can use them easily:
    [{"term": "pizza", "weight": 0.8}, {"term": "restaurant", "weight": 0.6}]
    """
    sorted_terms = sorted(profile.items(), key=lambda x: x[1], reverse=True)

    return [
        {"term": term, "weight": round(weight, 3)}
        for term, weight in sorted_terms[:n]
    ]