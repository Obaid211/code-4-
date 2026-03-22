import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import os
import requests
from typing import Any, Callable, Dict, List
from flask import (
    Flask, request, jsonify, Response, stream_with_context,
    render_template, send_from_directory, flash, redirect, url_for
)
from werkzeug.utils import secure_filename
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import base64
import json
from datetime import datetime
import pickle  # Added from new version
import numpy as np

# Import logging configuration (from old version)
try:
    from logging_config import (
        setup_logging, log_endpoint, log_external_api_call,
        log_prediction, log_user_activity, log_error_with_context
    )
    # Initialize loggers
    app_logger, api_logger, pred_logger, error_logger, perf_logger, user_logger = setup_logging(
        "smartagri_server")
except ImportError:
    # Fallback logger if logging_config.py is missing
    import logging
    print("[WARNING] logging_config.py not found. Using basic logging.")
    app_logger = logging.getLogger('app')
    app_logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    app_logger.addHandler(handler)
    # Create dummy decorators
    def log_endpoint(a: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
            return f
        return decorator
    def log_external_api_call(*args, **kwargs) -> None: pass
    def log_prediction(a: Any, b: Any, c: Any, d: Any) -> None: pass
    def log_error_with_context(e: BaseException, d: Any) -> None: app_logger.error(
        f"ERROR: {e}, Context: {d}")
    error_logger = app_logger


# Load environment variables
load_dotenv()
api_url = "https://crop.kindwise.com/api/v1/identification"

app = Flask(__name__, template_folder='templates',
            static_folder='static')  # From old version
CORS(app)  # Enable CORS for frontend requests
app.secret_key = os.environ.get("FLASK_SECRET", "supersecret")

# Upload configuration
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}

#
# --- API Keys from Environment Variables (from old version) ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
KINDWISE_API_KEY = os.getenv("KINDWISE_API_KEY")

# Initialize Groq client (from old version)
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

app_logger.info("=" * 60)
app_logger.info("SmartAgri Server Starting...")
app_logger.info(f"GROQ_API_KEY configured: {bool(GROQ_API_KEY)}")
app_logger.info(f"WEATHER_API_KEY configured: {bool(WEATHER_API_KEY)}")
app_logger.info(f"ELEVEN_API_KEY configured: {bool(ELEVEN_API_KEY)}")
app_logger.info("=" * 60)

# --- Load Machine Learning Models (from new version) ---
try:
    crop_model = pickle.load(
        open('models/crop_recommendation_model.pkl', 'rb'))
    app_logger.info("✓ Crop recommendation model loaded successfully")
except Exception as e:
    app_logger.error(
        f"⚠ Warning: Could not load crop model: {e}", exc_info=True)
    crop_model = None

try:
    irrigation_model = pickle.load(open('models/irrigation_model.pkl', 'rb'))
    app_logger.info("✓ Irrigation model loaded successfully")
except Exception as e:
    app_logger.error(
        f"⚠ Warning: Could not load irrigation model: {e}", exc_info=True)
    irrigation_model = None

# Fertilizer recommendations (from new version)
FERTILIZER_RECOMMENDATIONS = {
    'rice': 'Urea: 120 kg/ha\nDAP: 60 kg/ha\nPotash: 40 kg/ha',
    'wheat': 'Urea: 150 kg/ha\nDAP: 75 kg/ha\nPotash: 50 kg/ha',
    'maize': 'Urea: 100 kg/ha\nDAP: 50 kg/ha\nPotash: 30 kg/ha',
    'chickpea': 'Urea: 20 kg/ha\nDAP: 40 kg/ha\nPotash: 20 kg/ha',
    'kidneybeans': 'Urea: 25 kg/ha\nDAP: 50 kg/ha\nPotash: 25 kg/ha',
    'pigeonpeas': 'Urea: 20 kg/ha\nDAP: 40 kg/ha\nPotash: 20 kg/ha',
    'mothbeans': 'Urea: 20 kg/ha\nDAP: 35 kg/ha\nPotash: 15 kg/ha',
    'mungbean': 'Urea: 20 kg/ha\nDAP: 40 kg/ha\nPotash: 20 kg/ha',
    'blackgram': 'Urea: 20 kg/ha\nDAP: 40 kg/ha\nPotash: 20 kg/ha',
    'lentil': 'Urea: 20 kg/ha\nDAP: 40 kg/ha\nPotash: 20 kg/ha',
    'pomegranate': 'Urea: 200 kg/ha\nDAP: 100 kg/ha\nPotash: 100 kg/ha',
    'banana': 'Urea: 300 kg/ha\nDAP: 150 kg/ha\nPotash: 300 kg/ha',
    'mango': 'Urea: 250 kg/ha\nDAP: 125 kg/ha\nPotash: 125 kg/ha',
    'grapes': 'Urea: 180 kg/ha\nDAP: 90 kg/ha\nPotash: 90 kg/ha',
    'watermelon': 'Urea: 100 kg/ha\nDAP: 50 kg/ha\nPotash: 75 kg/ha',
    'muskmelon': 'Urea: 100 kg/ha\nDAP: 50 kg/ha\nPotash: 75 kg/ha',
    'apple': 'Urea: 200 kg/ha\nDAP: 100 kg/ha\nPotash: 100 kg/ha',
    'orange': 'Urea: 220 kg/ha\nDAP: 110 kg/ha\nPotash: 110 kg/ha',
    'papaya': 'Urea: 150 kg/ha\nDAP: 75 kg/ha\nPotash: 100 kg/ha',
    'coconut': 'Urea: 600 kg/ha\nDAP: 300 kg/ha\nPotash: 600 kg/ha',
    'cotton': 'Urea: 120 kg/ha\nDAP: 60 kg/ha\nPotash: 60 kg/ha',
    'jute': 'Urea: 80 kg/ha\nDAP: 40 kg/ha\nPotash: 40 kg/ha',
    'coffee': 'Urea: 250 kg/ha\nDAP: 125 kg/ha\nPotash: 125 kg/ha',
}

# Irrigation recommendation function (from new version)


def get_irrigation_recommendation(temperature, humidity, rainfall):
    """
    Simple rule-based irrigation recommendation
    You can replace this with your ML model prediction
    """
    priority = 0.0
    action = ""
    explanation = ""

    if rainfall < 50:
        priority += 0.4
    elif rainfall < 100:
        priority += 0.2

    if temperature > 30:
        priority += 0.3
    elif temperature > 25:
        priority += 0.15

    if humidity < 40:
        priority += 0.3
    elif humidity < 60:
        priority += 0.15

    priority = min(priority, 1.0)

    if priority >= 0.7:
        action = "Immediate Irrigation Required"
        explanation = f"With low rainfall ({rainfall:.1f}mm), high temperature ({temperature:.1f}°C), and humidity at {humidity:.1f}%, your crops need water urgently."
    elif priority >= 0.4:
        action = "Schedule Irrigation Soon"
        explanation = f"Current conditions (Temp: {temperature:.1f}°C, Humidity: {humidity:.1f}%, Rainfall: {rainfall:.1f}mm) suggest irrigation within 1-2 days."
    else:
        action = "No Irrigation Needed"
        explanation = f"Soil moisture appears adequate with recent rainfall ({rainfall:.1f}mm) and moderate conditions."

    return {
        "action": action,
        "priority": float(f"{priority:.2f}"),
        "explanation": explanation
    }

# Fallback recommendation function (from new version)


def get_fallback_recommendations(N, P, K, temperature, humidity, ph, rainfall):
    """
    Smarter rule-based crop recommendations when model is not available
    """
    app_logger.info(
        f"Generating SMARTER fallback for N:{N}, P:{P}, K:{K}, T:{temperature}, H:{humidity}, R:{rainfall}")
    recommendations = []

    # Rule 1: High NPK, High Water -> Rice, Banana, Coconut
    if N > 80 and P > 40 and K > 40 and temperature > 25 and humidity > 70 and rainfall > 150:
        crops = [
            ('Rice', 92, FERTILIZER_RECOMMENDATIONS['rice']),
            ('Banana', 85, FERTILIZER_RECOMMENDATIONS['banana']),
            ('Coconut', 80, FERTILIZER_RECOMMENDATIONS['coconut'])
        ]
    # Rule 2: Moderate NPK, Low Water -> Wheat, Chickpea, Lentil
    elif N > 60 and P > 30 and temperature > 18 and temperature < 28 and rainfall < 100:
        crops = [
            ('Wheat', 88, FERTILIZER_RECOMMENDATIONS['wheat']),
            ('Chickpea', 82, FERTILIZER_RECOMMENDATIONS['chickpea']),
            ('Lentil', 75, FERTILIZER_RECOMMENDATIONS['lentil'])
        ]
    # Rule 3: Low N, Low Water (Legumes) -> Pulses
    elif N < 40 and P > 20 and K > 20 and rainfall < 100:
        crops = [
            ('Mothbeans', 90, FERTILIZER_RECOMMENDATIONS['mothbeans']),
            ('Mungbean', 85, FERTILIZER_RECOMMENDATIONS['mungbean']),
            ('Pigeonpeas', 80, FERTILIZER_RECOMMENDATIONS['pigeonpeas'])
        ]
    # Rule 4: High Water, Warm -> Jute, Cotton
    elif temperature > 24 and humidity > 60 and rainfall > 120:
        crops = [
            ('Jute', 85, FERTILIZER_RECOMMENDATIONS['jute']),
            ('Cotton', 80, FERTILIZER_RECOMMENDATIONS['cotton']),
            ('Rice', 75, FERTILIZER_RECOMMENDATIONS['rice'])
        ]
    # Rule 5: Moderate conditions, High P/K -> Fruits
    elif P > 50 and K > 50 and temperature > 20 and ph > 5.5 and ph < 7:
        crops = [
            ('Grapes', 88, FERTILIZER_RECOMMENDATIONS['grapes']),
            ('Orange', 85, FERTILIZER_RECOMMENDATIONS['orange']),
            ('Apple', 80, FERTILIZER_RECOMMENDATIONS['apple'])
        ]
    # Fallback: General purpose crops
    else:
        crops = [
            ('Maize', 85, FERTILIZER_RECOMMENDATIONS['maize']),
            ('Wheat', 80, FERTILIZER_RECOMMENDATIONS['wheat']),
            ('Pigeonpeas', 75, FERTILIZER_RECOMMENDATIONS['pigeonpeas'])
        ]

    for crop, confidence, fertilizer in crops:
        recommendations.append({
            'crop': crop,
            'confidence': confidence,
            'fertilizer': fertilizer
        })

    return recommendations


# =====================================================================
# --- CHAT API ENDPOINTS (from old version) ---
# =====================================================================
try:
    from kindwise import CropHealthApi
except ImportError:
    CropHealthApi = None
    print("⚠️ kindwise package not installed. Install it using: pip install kindwise-api-client")

# Use your existing .env key name
KINDWISE_API_KEY = os.getenv("KINDWISE_API_KEY")
if not KINDWISE_API_KEY:
    print("⚠️ 'KINDWISE_API_KEY' not found in .env file. Please add it.")


def allowed_file(filename):
    """Check if uploaded file has an allowed image extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/crop-health", methods=["GET", "POST"])
def crop_health():
    """
    Upload a crop image → Analyze via Kindwise Crop.Health API → Render results in dashboard.html
    """
    if request.method == "GET":
        # Render your existing dashboard
        return render_template("dashboard.html")

    if "photo" not in request.files:
        flash("No file selected.")
        return redirect(url_for("crop_health"))

    file = request.files["photo"]
    if file.filename == "":
        flash("No file selected.")
        return redirect(url_for("crop_health"))

    if not allowed_file(file.filename):
        flash("File type not allowed. Please upload JPG or PNG.")
        return redirect(url_for("crop_health"))

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    if CropHealthApi is None:
        flash("Kindwise SDK not installed. Run: pip install kindwise-api-client")
        return redirect(url_for("crop_health"))

    try:
        api = CropHealthApi(KINDWISE_API_KEY)
        identification = api.identify(
            file_path, details=["taxonomy", "wiki_url"])
        result = identification.result

        crop_suggestions = []
        disease_suggestions = []
        plant_probability = getattr(result.is_plant, "probability", None)

        if hasattr(result, "crop") and result.crop and hasattr(result.crop, "suggestions"):
            for s in result.crop.suggestions:
                crop_suggestions.append({
                    "name": s.name,
                    "scientific_name": getattr(s, "scientific_name", None),
                    "probability": s.probability,
                })

        if hasattr(result, "disease") and result.disease and hasattr(result.disease, "suggestions"):
            for s in result.disease.suggestions:
                disease_suggestions.append({
                    "name": s.name,
                    "scientific_name": getattr(s, "scientific_name", None),
                    "probability": s.probability,
                })

        processed_result = {
            "is_plant": plant_probability,
            "crop_suggestions": crop_suggestions,
            "disease_suggestions": disease_suggestions,
            "image_url": url_for("uploaded_file", filename=filename)
        }

        # ✅ Use your existing dashboard to display results
        return render_template("dashboard.html", crop_result=processed_result)

    except Exception as e:
        flash(f"Error analyzing image: {e}")
        return redirect(url_for("crop_health"))


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    """Serve uploaded files for displaying in dashboard."""
    return app.send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/api/chat", methods=["POST"])
@log_endpoint("/api/chat")
def chat():
    """
    AI Chat endpoint using Groq API
    """
    try:
        if not GROQ_API_KEY or not groq_client:
            app_logger.error("Groq API key/client not configured")
            return jsonify({"error": "Chat service unavailable. Please add GROQ_API_KEY to your .env file"}), 503

        data = request.json
        if not data:
            return jsonify({"error": "Invalid JSON data"}), 400

        user_message = data.get("message", "")
        lang = data.get("lang", "en")

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        app_logger.info(
            f"Chat request: {user_message[:100]}... (lang: {lang})")

        system_prompt = """You are an expert agricultural assistant helping farmers with crop management, 
        pest control, weather advice, fertilizer recommendations, and general farming questions. 
        Provide practical, actionable advice in a friendly and clear manner. Keep responses concise 
        but informative. If asked about specific crops, pests, or farming practices, provide 
        region-appropriate advice for Indian agriculture when relevant."""

        if lang == "hi":
            system_prompt += " Respond in Hindi (Devanagari script)."
        elif lang == "bn":
            system_prompt += " Respond in Bengali (Bengali script)."

        def generate():
            try:
                assert groq_client is not None
                stream = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.7, max_tokens=1024, stream=True
                )
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            except Exception as e:
                log_error_with_context(
                    e, {"endpoint": "/api/chat", "stage": "streaming"})
                yield f"AI Error: {str(e)}"

        return Response(stream_with_context(generate()), mimetype='text/plain')

    except Exception as e:
        log_error_with_context(
            e, {"endpoint": "/api/chat", "stage": "initial"})
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route("/api/stt", methods=["POST"])
@log_endpoint("/api/stt")
def speech_to_text():
    """
    Speech-to-Text endpoint using Groq Whisper API
    """
    if not groq_client:
        error_logger.error("Groq API key not configured for STT")
        return jsonify({"error": "STT service unavailable. Please configure GROQ_API_KEY"}), 503

    try:
        if "file" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["file"]

        upload_dir = "temp_audio"
        os.makedirs(upload_dir, exist_ok=True)
        temp_path = os.path.join(upload_dir, "temp_audio.webm")
        audio_file.save(temp_path)

        app_logger.info("Processing speech-to-text request")

        with open(temp_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(temp_path, file.read()),
                model="whisper-large-v3",
                response_format="json",
            )

        os.remove(temp_path)
        text = transcription.text
        app_logger.info(f"STT result: {text[:100]}...")

        log_external_api_call("groq", "/audio/transcriptions", 200, 0)
        return jsonify({"text": text, "status": "success"})

    except Exception as e:
        log_error_with_context(e, {"endpoint": "/api/stt"})
        return jsonify({"error": f"STT failed: {str(e)}"}), 500


@app.route("/api/tts", methods=["POST"])
@log_endpoint("/api/tts")
def text_to_speech():
    """
    Text-to-Speech endpoint
    - Sarvam AI for Hindi (hi) and Bengali (bn)
    - ElevenLabs for English (en)
    """
    try:
        data = request.json
        text = data.get("text", "")
        lang = data.get("lang", "en")

        if not text:
            return jsonify({"error": "Text is required"}), 400

        app_logger.info(f"TTS request received | lang: {lang}")

        # ── Sarvam AI for Hindi / Bengali ──────────────────────────
        if lang in ("hi", "bn"):
            SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
            if not SARVAM_API_KEY:
                return jsonify({"error": "SARVAM_API_KEY not configured"}), 503

            # Map language to Sarvam speaker
            speaker_map = {
                "hi": "anushka",   # Natural Hindi female voice
                "bn": "anushka",   # Sarvam uses same model, language code changes output
            }
            language_code_map = {
                "hi": "hi-IN",
                "bn": "bn-IN",
            }

            payload = {
                "inputs": [text],
                "target_language_code": language_code_map[lang],
                "speaker": speaker_map[lang],
                "pitch": 0,
                "pace": 1.0,
                "loudness": 1.5,
                "speech_sample_rate": 22050,
                "enable_preprocessing": True,
                "model": "bulbul:v2"
            }

            try:
                response = requests.post(
                    "https://api.sarvam.ai/text-to-speech",
                    headers={
                        "Content-Type": "application/json",
                        "api-subscription-key": SARVAM_API_KEY
                    },
                    json=payload,
                    timeout=15
                )

                app_logger.info(f"Sarvam API response status: {response.status_code}")

                if response.status_code != 200:
                    app_logger.error(f"Sarvam API error: {response.status_code} - {response.text[:200]}")
                    return jsonify({"error": f"Sarvam API error: {response.text[:200]}"}), 500

                result = response.json()
                # Sarvam returns base64-encoded WAV audio
                audio_base64 = result["audios"][0]
                import base64
                audio_bytes = base64.b64decode(audio_base64)
                return Response(audio_bytes, mimetype="audio/wav")

            except requests.exceptions.Timeout:
                return jsonify({"error": "Sarvam API timed out"}), 500
            except Exception as e:
                app_logger.error(f"Sarvam TTS error: {e}")
                return jsonify({"error": str(e)}), 500

        # ── ElevenLabs for English ──────────────────────────────────
        else:
            if not ELEVEN_API_KEY:
                return jsonify({"error": "ELEVEN_API_KEY not configured"}), 503

            payload = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}
            }

            try:
                response = requests.post(
                    "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB",
                    headers={
                        "Accept": "audio/mpeg",
                        "Content-Type": "application/json",
                        "xi-api-key": ELEVEN_API_KEY
                    },
                    json=payload,
                    timeout=15
                )

                app_logger.info(f"ElevenLabs API response status: {response.status_code}")

                if response.status_code != 200:
                    app_logger.error(f"ElevenLabs error: {response.status_code} - {response.text[:200]}")
                    return jsonify({"error": f"ElevenLabs error: {response.text[:200]}"}), 500

                return Response(response.content, mimetype="audio/mpeg")

            except requests.exceptions.Timeout:
                return jsonify({"error": "ElevenLabs API timed out"}), 500
            except Exception as e:
                app_logger.error(f"ElevenLabs TTS error: {e}")
                return jsonify({"error": str(e)}), 500

    except Exception as e:
        import traceback
        traceback.print_exc()
        log_error_with_context(e, {"endpoint": "/api/tts"})
        return jsonify({"error": str(e)}), 500

# =====================================================================
# --- FARMING API ENDPOINTS (Merged) ---
# =====================================================================

# Replace the /api/analyze_plant endpoint in server.py with this:
@app.route("/api/analyze_plant", methods=["POST"])
@log_endpoint("/api/analyze_plant")
def analyze_plant():
    """
    Analyze plant image using Kindwise Crop Health API
    """
    if not KINDWISE_API_KEY:
        error_logger.error("Kindwise API key not configured")
        return jsonify({
            "status": "error",
            "message": "Plant analysis service unavailable. Please configure KINDWISE_API_KEY in .env file"
        }), 503

    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "No file uploaded"}), 400

        file = request.files["file"]

        # Validate file type
        if not file.filename:
            return jsonify({"status": "error", "message": "No file selected"}), 400

        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in {"jpg", "jpeg", "png"}):
            return jsonify({"status": "error", "message": "Invalid file type. Please upload JPG or PNG"}), 400

        # Read and encode image
        image_data = file.read()
        base64_image = base64.b64encode(image_data).decode('ascii')

        app_logger.info(f"Analyzing plant image: {file.filename}")

        # Call Kindwise Crop Health API (correct endpoint)
        api_url = "https://crop.kindwise.com/api/v1/identification"
        headers = {
            "Content-Type": "application/json",
            "Api-Key": KINDWISE_API_KEY
        }

        # Correct payload format for Kindwise
        payload = {
            "images": [base64_image],
            "similar_images": True
        }

        response = requests.post(
            api_url, json=payload, headers=headers, timeout=30)

        app_logger.info(
            f"Kindwise API response status: {response.status_code}")

        if response.status_code != 201:  # Kindwise returns 201 for successful creation
            try:
                error_data = response.json()
                error_msg = error_data.get('message', 'Unknown API error')
            except:
                error_msg = response.text[:200] if response.text else 'Unknown API error'

            app_logger.error(
                f"Kindwise API error: {response.status_code} - {error_msg}")
            return jsonify({
                "status": "error",
                "message": f"Plant identification failed: {error_msg}",
                "details": f"Status code: {response.status_code}"
            }), 500

        result = response.json()
        # ADD right after: result = response.json()
        app_logger.info(f"Kindwise result keys: {list(result.get('result', {}).keys())}")
        app_logger.info(f"Kindwise suggestions: {result.get('result', {}).get('classification', {}).get('suggestions', [])[:1]}")
        app_logger.info("Kindwise API call successful")

        # Check if plant was identified
        if not result.get('result') or not result['result'].get('is_plant'):
            is_plant_prob = result.get('result', {}).get(
                'is_plant', {}).get('probability', 0)
            if is_plant_prob < 0.5:
                app_logger.warning(f"Low plant probability: {is_plant_prob}")
                return jsonify({
                    "status": "no_plant_identified",
                    "message": "No plant could be identified in this image. Please upload a clearer photo of a plant or leaf."
                }), 200

        # Extract crop identification — Kindwise returns result.crop.suggestions directly
        crop_data = result.get('result', {}).get('crop', {})
        suggestions = crop_data.get('suggestions', [])

        app_logger.info(f"Crop suggestions: {len(suggestions)}, Disease data: {bool(result.get('result', {}).get('disease', {}))}")

        if not suggestions:
            return jsonify({
                "status": "no_plant_identified",
                "message": "Unable to identify the plant species. Try a clearer, closer photo of a leaf."
            }), 200

        # Get top suggestion
        top_plant = suggestions[0]
        plant_name = top_plant.get('name', 'Unknown Plant')
        plant_probability = top_plant.get('probability', 0)
        details = top_plant.get('details', {})

        # Extract health assessment — based on disease probabilities
        disease_data_check = result.get('result', {}).get('disease', {})
        disease_suggestions_check = disease_data_check.get('suggestions', [])

        # Filter out 'healthy' entry from disease list
        actual_diseases = [d for d in disease_suggestions_check if d.get('name', '').lower() != 'healthy']

        # If any actual disease has probability > 0.1, plant is unhealthy
        is_healthy = not any(d.get('probability', 0) > 0.1 for d in actual_diseases)

        # Health probability = 1 - highest disease probability
        top_disease_prob = max((d.get('probability', 0) for d in actual_diseases), default=0)
        is_healthy_probability = round(1.0 - top_disease_prob, 2)

        # Extract disease information
        diseases = []
        for disease in actual_diseases[:3]:
            disease_details = disease.get('details', {})
            treatment_list = disease_details.get('treatment', [])
            treatment_text = ''

            if isinstance(treatment_list, dict):
                parts = []
                for key, val in treatment_list.items():
                    if isinstance(val, list):
                        parts.extend([str(v) for v in val if v])
                    elif val:
                        parts.append(str(val))
                treatment_text = ' • '.join(parts)
            elif isinstance(treatment_list, list):
                all_treatments = []
                for item in treatment_list:
                    if isinstance(item, dict):
                        for key, val in item.items():
                            if isinstance(val, list):
                                all_treatments.extend([str(v) for v in val if v])
                            else:
                                all_treatments.append(str(val))
                    else:
                        all_treatments.append(str(item))
                treatment_text = ' • '.join(all_treatments)
            else:
                treatment_text = str(treatment_list) if treatment_list else 'Consult agricultural expert'

            cause_list = disease_details.get('cause', [])
            cause_text = ' '.join([str(c) for c in cause_list if c]) if isinstance(cause_list, list) else str(cause_list)

            diseases.append({
                'name': disease.get('name', 'Unknown Disease'),
                'probability': disease.get('probability', 0),
                'details': {
                    'common_names': disease_details.get('common_names', []),
                    'description': disease_details.get('description', ''),
                    'symptoms': cause_text,
                    'treatment': treatment_text,
                    'url': disease_details.get('url', '')
                }
            })

        app_logger.info(
            f"Plant identified: {plant_name} (confidence: {plant_probability:.2f}), Healthy: {is_healthy}")

        # Build response
        response_data = {
            "status": "success",
            "crop": {
                "name": plant_name,
                "probability": plant_probability,
                "common_names": details.get('common_names', []),
                "taxonomy": details.get('taxonomy', {}),
                "url": details.get('url', ''),
                "description": details.get('description', '')
            },
            "health": {
                "is_healthy": is_healthy,
                "health_probability": is_healthy_probability,
                "diseases": diseases
            }
        }

        # Log prediction
        try:
            log_prediction(
                "plant_analysis",
                {"filename": file.filename},
                {"plant": plant_name, "healthy": is_healthy,
                    "confidence": plant_probability},
                {"api": "kindwise_crop_health"}
            )
        except Exception as log_err:
            app_logger.warning(
                f"Logging failed but analysis succeeded: {log_err}")
        app_logger.info(f"Response health: is_healthy={is_healthy}, probability={is_healthy_probability}, diseases={len(diseases)}")
        return jsonify(response_data), 200

    except requests.exceptions.Timeout:
        app_logger.error("Kindwise API timeout")
        return jsonify({
            "status": "error",
            "message": "Plant identification service timed out. Please try again."
        }), 504

    except requests.exceptions.RequestException as e:
        app_logger.error(
            f"Kindwise API request failed: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Network error: {str(e)}"
        }), 500

    except Exception as e:
        app_logger.error(f"Plant analysis error: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500


@app.route("/api/recommend_crop", methods=['POST', 'OPTIONS'])
@log_endpoint("/api/recommend_crop")
def recommend_crop():
    """
    Recommends crops based on soil/env data (from new version)
    """
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        data = request.get_json()
        app_logger.info(f"Crop recommendation request for data: {data}")

        required_fields = ['N', 'P', 'K',
                           'temperature', 'humidity', 'ph', 'rainfall']
        for field in required_fields:
            if field not in data:
                app_logger.warning(
                    f"Crop recommendation request missing parameter: {field}")
                return jsonify({'error': f'Missing required field: {field}'}), 400

        N = float(data['N'])
        P = float(data['P'])
        K = float(data['K'])
        temperature = float(data['temperature'])
        humidity = float(data['humidity'])
        ph = float(data['ph'])
        rainfall = float(data['rainfall'])

        input_features = np.array(
            [[N, P, K, temperature, humidity, ph, rainfall]])
        irrigation = get_irrigation_recommendation(
            temperature, humidity, rainfall)

        recommendations: List[Dict[str, Any]] = []

        # *** START OF IMPROVED LOGIC ***

        if crop_model:
            try:
                app_logger.info(
                    "Attempting prediction with loaded crop_model.")
                if hasattr(crop_model, 'predict_proba'):
                    probabilities = crop_model.predict_proba(input_features)[0]
                    classes = crop_model.classes_

                    # Get top 10 for filtering
                    top_indices = np.argsort(probabilities)[-10:][::-1]

                    unique_crops = set()
                    filtered_recommendations = []

                    # Collect up to 3 unique crops
                    for idx in top_indices:
                        crop_name = classes[idx]
                        if crop_name.lower() not in unique_crops:
                            confidence = round(probabilities[idx] * 100, 1)
                            fertilizer = FERTILIZER_RECOMMENDATIONS.get(
                                crop_name.lower(),
                                'Urea: 100 kg/ha\nDAP: 50 kg/ha\nPotash: 40 kg/ha'
                            )
                            filtered_recommendations.append({
                                'crop': crop_name.capitalize(),
                                'confidence': confidence,
                                'fertilizer': fertilizer
                            })
                            unique_crops.add(crop_name.lower())
                        if len(filtered_recommendations) == 3:
                            break

                    recommendations = filtered_recommendations
                    app_logger.info(
                        f"Model prediction successful: {[r['crop'] for r in recommendations]}")

                else:
                    app_logger.warning(
                        "Model lacks 'predict_proba', using 'predict'.")
                    prediction = crop_model.predict(input_features)[0]
                    crop_name = prediction
                    fertilizer = FERTILIZER_RECOMMENDATIONS.get(
                        crop_name.lower(),
                        'Urea: 100 kg/ha\nDAP: 50 kg/ha\nPotash: 40 kg/ha'
                    )
                    recommendations.append({
                        'crop': crop_name.capitalize(),
                        'confidence': 95.0,
                        'fertilizer': fertilizer
                    })
                    app_logger.info(
                        f"Model prediction successful: {recommendations[0]['crop']}")
            except Exception as e:
                app_logger.error(
                    f"MODEL PREDICTION FAILED! Error: {e}", exc_info=True)
                log_error_with_context(
                    e, {"endpoint": "/api/recommend_crop", "stage": "prediction", "input": data})
                app_logger.warning(
                    "Using fallback recommendations due to prediction error.")
                recommendations = get_fallback_recommendations(
                    N, P, K, temperature, humidity, ph, rainfall)
        else:
            app_logger.warning(
                "Crop model not loaded, using fallback recommendations.")
            recommendations = get_fallback_recommendations(
                N, P, K, temperature, humidity, ph, rainfall)

        # Ensure fallback recommendations are unique and limited to top 3 if needed
        unique_recs = []
        seen = set()
        for rec in recommendations:
            crop_name_str = str(rec['crop']).lower()
            if crop_name_str not in seen:
                unique_recs.append(rec)
                seen.add(crop_name_str)
            if len(unique_recs) == 3:
                break
        recommendations = unique_recs

        response_data = {'irrigation': irrigation,
                         'recommendations': recommendations}

        if recommendations:
            log_prediction(
                "crop_recommendation",
                {"input_features": data},
                {"top_crops": [rec['crop'] for rec in recommendations], "confidences": [
                    rec['confidence'] for rec in recommendations]},
                {"model": "crop_recommendation_model.pkl"}
            )

        return jsonify(response_data), 200

    except Exception as e:
        log_error_with_context(
            e, {"endpoint": "/api/recommend_crop", "stage": "request"})
        return jsonify({'error': str(e)}), 500

# =====================================================================
# --- SPA SERVING (React frontend) ---
# =====================================================================

# Catch-all: serve index.html for ALL non-API routes (React SPA handles routing)
@app.route("/")
@app.route("/dashboard")
@app.route("/analyzer")
@app.route("/market")
@app.route("/chat")
@app.route("/about")
@app.route("/contact")
@app.route("/login")
@app.route("/signup")
@app.route("/profile")
def serve_spa():
    return render_template("index.html")


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


@app.route("/api/health")
@log_endpoint("/api/health")
def health_check():
    """Merged health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'crop_model_loaded': crop_model is not None,
        'irrigation_model_loaded': irrigation_model is not None,
        "groq_configured": bool(GROQ_API_KEY),
        "elevenlabs_configured": bool(ELEVEN_API_KEY),
        "weather_configured": bool(WEATHER_API_KEY)
    }), 200


if __name__ == "__main__":
    # Create models directory if it doesn't exist (from new version)
    os.makedirs('models', exist_ok=True)
    os.makedirs('temp_audio', exist_ok=True)  # For STT
    os.makedirs('uploads', exist_ok=True)  # For plant analyzer

    # Warnings (from old version)
    if not GROQ_API_KEY:
        print("\n⚠️  WARNING: GROQ_API_KEY not found in .env file")
        print("Chat and STT features will not work without it.\n")

    if not ELEVEN_API_KEY:
        print("\n⚠️  WARNING: ELEVEN_API_KEY not found in .env file")
        print("TTS features will not work without it.\n")

    # Merged startup log
    app_logger.info("\n" + "="*60)
    app_logger.info("🌾 SmartAgri AI Server Starting...")
    app_logger.info("="*60)
    app_logger.info(
        f"Crop Model: {'✓ Loaded' if crop_model else '✗ Not loaded (using fallback)'}")
    app_logger.info(
        f"Irrigation Model: {'✓ Loaded' if irrigation_model else '✗ Not loaded (using rules)'}")
    app_logger.info(
        f"Groq (Chat/STT): {'✓ Configured' if GROQ_API_KEY else '✗ Not configured'}")
    app_logger.info(
        f"ElevenLabs (TTS): {'✓ Configured' if ELEVEN_API_KEY else '✗ Not configured'}")
    app_logger.info("="*60 + "\n")

    print("\n" + "="*60)
    print("🌾 SmartAgri Server Starting")
    print("="*60)
    print("Server URL: http://127.0.0.1:5000")
    print("Dashboard:  http://127.0.0.1:5000/dashboard")
    print("Chat Page:  http://127.0.0.1:5000/chat")
    print("Logs:       Check logs/ directory (if logging_config.py exists)")
    print("="*60 + "\n")

    app.run(debug=True, host="127.0.0.1", port=5000)
