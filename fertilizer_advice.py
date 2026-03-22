# fertilizer_advice.py

fertilizer_map = {
    "rice": "Use Urea (50 kg/ha) and DAP (40 kg/ha). Maintain standing water.",
    "wheat": "Apply NPK 20:20:0 at sowing + Urea after 45 days.",
    "maize": "Use Urea (50 kg/ha) + MOP (25 kg/ha). Avoid overwatering.",
    "cotton": "Apply compost + Urea (40 kg/ha) after flowering.",
    "sugarcane": "Use organic manure + NPK 30:10:10 every 2 months.",
    "barley": "Use NPK 15:15:15 and irrigate moderately.",
    "mungbean": "Use compost and minimal Urea, needs less N fertilizer."
}

def get_fertilizer(crop_name):
    """Return fertilizer advice for a crop"""
    return fertilizer_map.get(crop_name.lower(), "Use balanced NPK and organic compost.")