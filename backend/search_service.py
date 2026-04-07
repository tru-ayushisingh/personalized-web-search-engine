# backend/search_service.py
from serpapi import GoogleSearch
from config import Config

def fetch_results(query: str, location_hint: str = "") -> list[dict]:
    """
    Fetch top results from Google (via SerpAPI).
    Optionally appends location_hint to query for geo-boosting.

    Returns:
        list of dicts with keys: title, link, snippet, display_link
    """
    # Append city to query for location awareness
    full_query = f"{query} {location_hint}".strip() if location_hint else query

    params = {
        "q":       full_query,
        "num":     Config.MAX_RESULTS,
        "api_key": Config.SERPAPI_KEY,
        "engine":  "google",
    }

    try:
        search  = GoogleSearch(params)
        data    = search.get_dict()
    except Exception as e:
        raise RuntimeError(f"SerpAPI request failed: {e}")

    # Check for API-level errors
    if "error" in data:
        raise RuntimeError(f"SerpAPI error: {data['error']}")

    items   = data.get("organic_results", [])

    # Return empty list gracefully if no results
    if not items:
        return []

    results = []
    for item in items:
        results.append({
            "title":        item.get("title", ""),
            "link":         item.get("link", ""),
            "snippet":      item.get("snippet", ""),
            "display_link": item.get("displayed_link", ""),
        })

    return results