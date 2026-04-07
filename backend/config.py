# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SERPAPI_KEY           = os.environ.get("SERPAPI_KEY", "")
    LOCATION_BOOST_WEIGHT = 0.15
    PROFILE_DECAY         = 0.80
    MAX_RESULTS           = 10
    SECRET_KEY            = os.environ.get("SECRET_KEY", "dev-secret-key")