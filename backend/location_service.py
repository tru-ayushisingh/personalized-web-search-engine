# backend/location_service.py
"""
Converts (latitude, longitude) coordinates to a human-readable city name.
Uses the free BigDataCloud Reverse Geocoding API (no API key required).
"""
import requests

REVERSE_GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client"

def get_city_from_coords(lat: float, lng: float) -> dict:
    """
    Args:
        lat: Latitude from HTML5 Geolocation API.
        lng: Longitude from HTML5 Geolocation API.

    Returns:
        dict with keys: city, region, country, display_name
    """
    try:
        params = {
            "latitude":  lat,
            "longitude": lng,
            "localityLanguage": "en"
        }
        response = requests.get(REVERSE_GEOCODE_URL, params=params, timeout=3)
        response.raise_for_status()
        data = response.json()

        city    = data.get("city") or data.get("locality") or ""
        region  = data.get("principalSubdivision", "")
        country = data.get("countryName", "")

        return {
            "city":         city,
            "region":       region,
            "country":      country,
            "display_name": f"{city}, {region}, {country}".strip(", ")
        }
    except Exception as e:
        return {"city": "", "region": "", "country": "", "display_name": "Unknown"}