# irrigation_advisor.py

def irrigation_advice(crop, temperature, humidity, rainfall, soil_moisture=None):
    """
    Simple rule-based irrigation advisor.
    Inputs:
      - crop (str)
      - temperature (°C) (float)
      - humidity (%) (float)
      - rainfall (mm) recent (float)
      - soil_moisture (optional %)
    Returns:
      - dict with 'action' and 'explanation' and a 'priority' score (0-1)
    """

    # normalize inputs to floats
    temperature = float(temperature)
    humidity = float(humidity)
    rainfall = float(rainfall) if rainfall is not None else 0.0
    sm = float(soil_moisture) if soil_moisture is not None else None

    score = 0.5  # baseline: 0 = definitely don't water, 1 = definitely water

    # Temperature effect: hotter -> more evap -> increase score
    if temperature >= 35:
        score += 0.25
    elif temperature >= 30:
        score += 0.15
    elif temperature <= 15:
        score -= 0.1

    # Humidity effect: dry air -> increase score; high humidity -> reduce
    if humidity < 40:
        score += 0.2
    elif humidity > 75:
        score -= 0.2
    elif humidity > 60:
        score -= 0.05

    # Recent rainfall reduces need to irrigate
    if rainfall >= 20:
        score -= 0.4
    elif rainfall >= 5:
        score -= 0.15

    # Optional soil moisture overrides (if sensor present)
    if sm is not None:
        if sm < 30:
            score += 0.3
        elif sm > 60:
            score -= 0.3

    # Crop-specific tweak: some crops need more frequent watering
    crop = crop.lower() if crop else ""
    thirsty_crops = ["rice", "sugarcane"]
    drought_tolerant = ["mungbean", "millet", "sorghum"]

    if crop in thirsty_crops:
        score += 0.12
    if crop in drought_tolerant:
        score -= 0.12

    # clamp score to [0,1]
    if score < 0:
        score = 0.0
    if score > 1:
        score = 1.0

    # map score to action
    if score >= 0.65:
        action = "Irrigate now"
        explanation = "Conditions favor irrigation (high temp / low humidity / low recent rainfall)."
    elif score >= 0.35:
        action = "Monitor & consider irrigation"
        explanation = "Conditions are borderline — check soil moisture or irrigate a small amount."
    else:
        action = "No irrigation needed"
        explanation = "Recent rainfall and humidity suggest irrigation can be delayed."

    return {"action": action, "explanation": explanation, "priority": round(score, 2)}

# <-- Make sure the second, simpler definition is DELETED -->