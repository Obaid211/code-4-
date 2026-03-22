from flask import Flask, request, render_template
import joblib
import numpy as np
from fertilizer_advice import get_fertilizer
from irrigation_advisor import irrigation_advice

app = Flask(__name__)

# Load model once at startup
model = joblib.load("model/crop_recommender.pkl")

@app.route("/")
def home():
    return render_template("dashboard.html")

@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        # Collect form data
        N = float(request.form['N'])
        P = float(request.form['P'])
        K = float(request.form['K'])
        temperature = float(request.form['temperature'])
        humidity = float(request.form['humidity'])
        ph = float(request.form['ph'])
        rainfall = float(request.form['rainfall'])

        # Prepare input for model
        X = np.array([[N, P, K, temperature, humidity, ph, rainfall]])

        # Predict probabilities for all crops
        probs = model.predict_proba(X)[0]
        crops = model.classes_

        # Get top 3 crops
        top_idx = probs.argsort()[-3:][::-1]

        results = []
        for i in top_idx:
            crop = crops[i]
            results.append({
                "crop": crop,
                "confidence": round(float(probs[i]) * 100, 2),
                "fertilizer": get_fertilizer(crop)
            })

        # --- THIS IS THE FIXED PART ---
        # 1. Get the top recommended crop from your results list
        top_crop = results[0]["crop"] 

        # 2. Pass the top crop to the irrigation advisor
        irrigation = irrigation_advice(top_crop, temperature, humidity, rainfall)
        # --- END OF FIX ---

        return render_template("dashboard.html", results=results, irrigation=irrigation)

    except Exception as e:
        # Improved error logging
        print(f"An error occurred: {e}")
        return render_template("dashboard.html", error_message=str(e))
    
if __name__ == "__main__":
    app.run(debug=True)
