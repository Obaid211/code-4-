"""
setup_profile.py
----------------
Run this once to create / update your farmer profile.
Usage: python setup_profile.py
"""

from farmer_profile import save_profile, build_profile_context

print("\n🌾 SmartAgri — Farmer Profile Setup")
print("=" * 40)
print("Press Enter to skip any field.\n")

def ask(prompt, default=None):
    val = input(f"{prompt}: ").strip()
    return val if val else default

def ask_list(prompt):
    raw = input(f"{prompt} (comma-separated): ").strip()
    if not raw:
        return []
    return [x.strip().lower() for x in raw.split(",") if x.strip()]

profile = {
    "name":             ask("Your name"),
    "location":         ask("Village / District"),
    "state":            ask("State (e.g. West Bengal, Punjab)"),
    "farm_size_acres":  ask("Farm size in acres (e.g. 2.5)"),
    "soil_type":        ask("Soil type [loamy/clayey/sandy/silty/black/red/alluvial]"),
    "irrigation_type":  ask("Irrigation type [drip/sprinkler/flood/rainfed/canal/borewell]"),
    "current_crops":    ask_list("Current crops (e.g. rice, wheat, mustard)"),
    "past_crops":       ask_list("Past/rotation crops"),
    "livestock":        ask_list("Livestock (e.g. cattle, goat, poultry)"),
    "challenges":       ask_list("Challenges (e.g. pest attacks, water shortage, low yield)"),
    "languages":        ask_list("Preferred languages [en/hi/bn]") or ["en"],
}

# Convert farm size to float if provided
if profile["farm_size_acres"]:
    try:
        profile["farm_size_acres"] = float(profile["farm_size_acres"])
    except ValueError:
        profile["farm_size_acres"] = None

saved = save_profile(profile)

print("\n✅ Profile saved successfully!")
print("\n--- Context that will be injected into chat ---")
print(build_profile_context(saved))
