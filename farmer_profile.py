"""
farmer_profile.py
-----------------
Handles saving, loading, and building context strings from
the farmer's profile for SmartAgri chatbot prompt injection.
"""

import json
import os

PROFILE_PATH = "data/farmer_profile.json"

DEFAULT_PROFILE = {
    "name": "",
    "location": "",
    "state": "",
    "farm_size_acres": None,
    "soil_type": "",          # loamy, clayey, sandy, silty, black, red
    "irrigation_type": "",    # drip, sprinkler, flood, rainfed
    "current_crops": [],      # e.g. ["rice", "wheat"]
    "past_crops": [],         # rotation history
    "languages": ["en"],      # preferred languages
    "challenges": [],         # e.g. ["pest attacks", "water shortage"]
    "livestock": [],          # e.g. ["cattle", "poultry"]
    "created_at": "",
    "updated_at": ""
}


def ensure_data_dir():
    """Ensure the data/ directory exists."""
    os.makedirs("data", exist_ok=True)


def load_profile() -> dict:
    """Load farmer profile from disk. Returns default if not found."""
    ensure_data_dir()
    if not os.path.exists(PROFILE_PATH):
        return dict(DEFAULT_PROFILE)
    try:
        with open(PROFILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Merge with defaults so new fields are always present
        merged = dict(DEFAULT_PROFILE)
        merged.update(data)
        return merged
    except (json.JSONDecodeError, IOError):
        return dict(DEFAULT_PROFILE)


def save_profile(profile: dict) -> dict:
    """Save farmer profile to disk. Returns saved profile."""
    ensure_data_dir()
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    if not profile.get("created_at"):
        profile["created_at"] = now
    profile["updated_at"] = now

    with open(PROFILE_PATH, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)
    return profile


def build_profile_context(profile: dict) -> str:
    """
    Convert a farmer profile dict into a natural-language context
    string that gets injected into the Groq system prompt.
    Returns empty string if profile is essentially empty.
    """
    parts = []

    if profile.get("name"):
        parts.append(f"The farmer's name is {profile['name']}.")

    location_parts = []
    if profile.get("location"):
        location_parts.append(profile["location"])
    if profile.get("state"):
        location_parts.append(profile["state"])
    if location_parts:
        parts.append(f"They are located in {', '.join(location_parts)}, India.")

    if profile.get("farm_size_acres"):
        parts.append(f"Their farm is approximately {profile['farm_size_acres']} acres.")

    if profile.get("soil_type"):
        parts.append(f"The soil type is {profile['soil_type']}.")

    if profile.get("irrigation_type"):
        parts.append(f"They use {profile['irrigation_type']} irrigation.")

    if profile.get("current_crops"):
        crops = ", ".join(profile["current_crops"])
        parts.append(f"Currently growing: {crops}.")

    if profile.get("past_crops"):
        past = ", ".join(profile["past_crops"])
        parts.append(f"Previously grown crops include: {past}.")

    if profile.get("livestock"):
        animals = ", ".join(profile["livestock"])
        parts.append(f"They also maintain livestock: {animals}.")

    if profile.get("challenges"):
        issues = ", ".join(profile["challenges"])
        parts.append(f"Known challenges they face: {issues}.")

    if not parts:
        return ""

    context = (
        "\n\n--- FARMER PROFILE CONTEXT ---\n"
        + " ".join(parts)
        + "\nUse this context to give personalised, region-specific advice. "
        "Address the farmer by name when appropriate. "
        "Tailor crop, pest, and fertilizer recommendations to their soil type, "
        "irrigation method, and location.\n"
        "--- END PROFILE CONTEXT ---\n"
    )
    return context


def validate_profile(data: dict) -> tuple[bool, str]:
    """
    Basic validation of incoming profile data.
    Returns (is_valid, error_message).
    """
    if not isinstance(data, dict):
        return False, "Profile must be a JSON object."

    # Optional but type-checked fields
    if "farm_size_acres" in data and data["farm_size_acres"] is not None:
        try:
            data["farm_size_acres"] = float(data["farm_size_acres"])
            if data["farm_size_acres"] <= 0:
                return False, "farm_size_acres must be a positive number."
        except (ValueError, TypeError):
            return False, "farm_size_acres must be a number."

    list_fields = ["current_crops", "past_crops", "languages", "challenges", "livestock"]
    for field in list_fields:
        if field in data and not isinstance(data[field], list):
            return False, f"'{field}' must be a list."

    str_fields = ["name", "location", "state", "soil_type", "irrigation_type"]
    for field in str_fields:
        if field in data and not isinstance(data[field], str):
            return False, f"'{field}' must be a string."

    valid_soils = {"loamy", "clayey", "sandy", "silty", "black", "red", "alluvial", "laterite", ""}
    if data.get("soil_type", "").lower() not in valid_soils:
        return False, f"soil_type must be one of: {', '.join(s for s in valid_soils if s)}."

    valid_irrigation = {"drip", "sprinkler", "flood", "rainfed", "canal", "well", "borewell", ""}
    if data.get("irrigation_type", "").lower() not in valid_irrigation:
        return False, f"irrigation_type must be one of: {', '.join(s for s in valid_irrigation if s)}."

    return True, ""
