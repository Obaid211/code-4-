// SmartAgri API Service
// Centralized API helpers — plain JS, no JSX

const API_BASE = window.location.origin;

const SmartAgriAPI = {
  // Chat — streaming response
  async chatStream(message, lang = 'en', onChunk) {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lang }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Server error' }));
      throw new Error(err.error || 'Chat request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      if (onChunk) onChunk(chunk, fullText);
    }

    return fullText;
  },

  // Speech-to-Text
  async speechToText(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    const response = await fetch(`${API_BASE}/api/stt`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('STT failed');
    return response.json();
  },

  // Text-to-Speech
  async textToSpeech(text, lang = 'en') {
    const response = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),  // ← add lang here
    });

    if (!response.ok) throw new Error('TTS failed');
    return response.blob();
  },

  // Crop Recommendation
  async recommendCrop(data) {
    const response = await fetch(`${API_BASE}/api/recommend_crop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Server error' }));
      throw new Error(err.error || 'Recommendation failed');
    }

    return response.json();
  },

  // Plant Analysis
  async analyzePlant(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/analyze_plant`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Server error' }));
      throw new Error(err.message || err.error || 'Analysis failed');
    }

    return response.json();
  },

  // Health Check
  async healthCheck() {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.json();
  },

  // Weather (Open-Meteo)
  async getWeather(lat, lon) {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
    );
    return response.json();
  },

  // Geocoding
  async geocodeCity(city) {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    return response.json();
  },

  // Reverse Geocoding
  async reverseGeocode(lat, lon) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    return response.json();
  },
};

// Weather code lookup
const WEATHER_CODES = {
  0: { icon: '☀️', text: 'Sunny' },
  1: { icon: '🌤️', text: 'Mostly Sunny' },
  2: { icon: '⛅', text: 'Partly Cloudy' },
  3: { icon: '☁️', text: 'Cloudy' },
  45: { icon: '🌫️', text: 'Foggy' },
  48: { icon: '🌫️', text: 'Foggy' },
  51: { icon: '🌧️', text: 'Drizzle' },
  53: { icon: '🌧️', text: 'Drizzle' },
  55: { icon: '🌧️', text: 'Heavy Drizzle' },
  61: { icon: '🌧️', text: 'Rainy' },
  63: { icon: '🌧️', text: 'Moderate Rain' },
  65: { icon: '⛈️', text: 'Heavy Rain' },
  71: { icon: '❄️', text: 'Snowy' },
  73: { icon: '❄️', text: 'Moderate Snow' },
  75: { icon: '❄️', text: 'Heavy Snow' },
  95: { icon: '⛈️', text: 'Thunderstorm' },
};

window.SmartAgriAPI = SmartAgriAPI;
window.WEATHER_CODES = WEATHER_CODES;
