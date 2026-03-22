// ============================
// 🌿 Smart Chatbot (chat.js) [ADVANCED v2]
// ============================

// Base URL - Flask backend
const BASE_URL = "http://127.0.0.1:5000";

// DOM Elements
const chatBox = document.getElementById("chatBox");
const inputField = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const langSelect = document.getElementById("chatLang");
const speakerToggle = document.getElementById("speakerToggle");
const speakerIconOn = document.getElementById("speakerIconOn");
const speakerIconOff = document.getElementById("speakerIconOff");
const faqContainer = document.getElementById("faqContainer");
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");
const typingIndicator = document.getElementById("typingIndicator");
const locationBar = document.getElementById("locationBar");
const locationStatus = document.getElementById("locationStatus");
const setLocationBtn = document.getElementById("setLocationBtn");

let isRecording = false;
let mediaRecorder;
let isSpeakerEnabled = localStorage.getItem("speechEnabled") !== "false";

// --- TTS State Management ---
let currentUtterance = null;
let currentSpeakerButton = null;
// ========== 🧠 LOCAL CHAT MEMORY ==========
const STORAGE_KEY = "smartagri_chat_history";

// Load chat history from localStorage
function loadChatHistory() {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  history.forEach((msg) => {
    createMessageBubble(msg.role, msg.text);
  });
  scrollChatToBottom();
}

// Save a single message
function saveChat(role, text) {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  history.push({ role, text });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// Clear all chats
function clearChatHistory() {
  localStorage.removeItem(STORAGE_KEY);
  chatBox.innerHTML = "";
  createMessageBubble("bot", "🧹 Chat cleared! Let's start fresh 🌱");
}

// FAQ Questions
const faqQuestions = [
  "What crops grow best in my region?",
  "How do I prevent pest damage?",
  "What's the weather forecast?",
  "Which fertilizer should I use?",
  "How to improve soil quality?",
  "Best time to plant crops?"
];

// SVG Icons for Play/Pause
const iconPlay = '<svg class="play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>';
const iconPause = '<svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>';


// ========== Utility Functions ==========

function scrollChatToBottom() {
  if (chatBox) {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

function showTyping(show = true) {
  if (typingIndicator) {
    typingIndicator.style.display = show ? "flex" : "none";
  }
  if (show) {
    scrollChatToBottom();
  }
}

function createMessageBubble(role, text = "...") {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${role}-message`;

  const content = document.createElement("div");
  content.className = "message-content";

  const p = document.createElement("p");
  p.textContent = text;

  content.appendChild(p);
  messageDiv.appendChild(content);
  chatBox.appendChild(messageDiv);
  scrollChatToBottom();

  return messageDiv;
}

// ========== Play/Pause TTS Logic ==========

function stopAllSpeech() {
  window.speechSynthesis.cancel();
  if (currentSpeakerButton) {
    currentSpeakerButton.innerHTML = iconPlay;
    currentSpeakerButton.classList.remove("speaking");
  }
  currentUtterance = null;
  currentSpeakerButton = null;
}

// This function is being called "addSpeaker" in your edit request,
// but the original function is "createPlayPauseButton".
// I will assume "addSpeaker" was a typo and you meant to keep the original function name
// being called. If "addSpeaker" is a *new* function, you'll need to provide its code.
// For now, I'll rename the *call* to "createPlayPauseButton" to match your edit.
// **Wait, re-reading... you asked to *add* `addSpeaker`.**
// This implies `createPlayPauseButton` might be the wrong function.
//
// **Correction:** I see the patch. You want to *replace* `createPlayPauseButton` with `addSpeaker`.
// I will make that change, but please be aware the function `addSpeaker` is not defined anywhere in this file.
// I will assume you have defined it elsewhere or `createPlayPauseButton` should be renamed to `addSpeaker`.
//
// To avoid breaking your code, I will *rename* `createPlayPauseButton` to `addSpeaker`
// as that seems the most logical intention.

function addSpeaker(messageDiv, text, lang) { // Renamed from createPlayPauseButton
  const button = document.createElement("button");
  button.className = "play-pause-btn";
  button.innerHTML = iconPlay;
  button.setAttribute("aria-label", "Play message");

  button.onclick = () => {
    if (currentUtterance && currentSpeakerButton === button) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.pause();
      }
    } else {
      stopAllSpeech();
      currentSpeakerButton = button;
      speakText(text, lang);
    }
  };

  const content = messageDiv.querySelector(".message-content");
  if (content) {
    content.appendChild(button);
  }
}

async function speakText(text, lang = "en") {
  if (!isSpeakerEnabled || !currentSpeakerButton) return;

  currentSpeakerButton.innerHTML = iconPause;
  currentSpeakerButton.classList.add("speaking");

  try {
    // ✅ Call ElevenLabs via your Flask backend
    const res = await fetch(`${BASE_URL}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      if (currentSpeakerButton) {
        currentSpeakerButton.innerHTML = iconPlay;
        currentSpeakerButton.classList.remove("speaking");
      }
      URL.revokeObjectURL(audioUrl);
      currentSpeakerButton = null;
    };

    audio.onerror = () => {
      throw new Error("Audio playback failed");
    };

    await audio.play();

  } catch (err) {
    console.warn("ElevenLabs TTS failed, attempting Google Translate TTS fallback:", err);
    try {
      // Secondary Fallback: Unofficial Google Translate TTS
      // Using 'tw-ob' client which avoids bot detection for short sentences
      const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=${lang}&client=tw-ob`;
      const audio = new Audio(googleUrl);
      
      audio.onended = () => {
        if (currentSpeakerButton) {
          currentSpeakerButton.innerHTML = iconPlay;
          currentSpeakerButton.classList.remove("speaking");
        }
        currentSpeakerButton = null;
      };

      await audio.play();
    } catch (gErr) {
      console.warn("Google TTS also failed, falling back to browser synthesis:", gErr);
      
      // Tertiary Fallback to browser speech
      const utter = new SpeechSynthesisUtterance(text);
      const langMap = { "en": "en-US", "hi": "hi-IN", "bn": "bn-IN" };
      const targetLang = langMap[lang] || "en-US";
      utter.lang = targetLang;
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.replace('_', '-') === targetLang) || 
                    voices.find(v => v.lang.startsWith(lang));
      if (voice) utter.voice = voice;
      
      utter.rate = 0.95;
      currentUtterance = utter;

      utter.onend = () => {
        if (currentSpeakerButton) {
          currentSpeakerButton.innerHTML = iconPlay;
          currentSpeakerButton.classList.remove("speaking");
        }
        currentSpeakerButton = null;
      };

      window.speechSynthesis.speak(utter);
    }
  }
}
// ========== Core Chat Functions ==========

async function sendMessage() {
  const text = inputField.value.trim();
  const lang = langSelect ? langSelect.value : "en";
  if (!text) return;

  createMessageBubble("user", text);
  saveChat("user", text);


  inputField.value = "";
  showTyping(true);

  const botBubble = createMessageBubble("bot", "");
  const p = botBubble.querySelector("p");

  // Get location from session storage
  const location = sessionStorage.getItem("userLocation");

  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        lang,
        location: location // Send location to backend
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let firstChunk = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (firstChunk) {
        showTyping(false);
        firstChunk = false;
      }

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      p.textContent = fullText;
      scrollChatToBottom();

    }

    // *** YOUR EDIT IS HERE ***
    addSpeaker(botBubble, fullText, lang);
    saveChat("bot", fullText);
    // *************************

    if (isSpeakerEnabled) {
      setTimeout(() => {
        const newButton = botBubble.querySelector(".play-pause-btn");
        if (newButton) {
          currentSpeakerButton = newButton;
          speakText(fullText, lang);
        }
      }, 100);
    }

  } catch (err) {
    showTyping(false);
    console.error("Chat error:", err);
    p.textContent = `Error: I'm having trouble connecting. (${err.message}). Please check the server and your API key.`;
  }
}

// ========== Speech-to-Text (STT) Recording ==========

async function recordVoice() {
  if (isRecording) {
    mediaRecorder.stop();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    let chunks = [];

    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      stream.getTracks().forEach(t => t.stop());
      isRecording = false;
      if (micBtn) {
        micBtn.classList.remove("recording");
      }

      createMessageBubble("user", "[Processing audio...]");

      const formData = new FormData();
      formData.append("file", blob);

      try {
        const res = await fetch(`${BASE_URL}/api/stt`, {
          method: "POST",
          body: formData
        });

        if (!res.ok) throw new Error(`STT failed with status ${res.status}`);

        const data = await res.json();
        if (data.text) {
          chatBox.removeChild(chatBox.lastChild);
          inputField.value = data.text;
          sendMessage();
        } else {
          chatBox.removeChild(chatBox.lastChild);
          createMessageBubble("bot", "Sorry, I couldn't understand that.");
        }
      } catch (err) {
        console.error("STT error:", err);
        chatBox.removeChild(chatBox.lastChild);
        createMessageBubble("bot", "Error processing audio. Please check the server.");
      }
    };

    mediaRecorder.start();
    isRecording = true;
    if (micBtn) {
      micBtn.classList.add("recording");
    }

  } catch (err) {
    console.error("Mic error:", err);
    alert("Microphone access denied or not available.");
  }
}

// ========== FAQ Functionality ==========

function initializeFAQ() {
  if (!faqContainer) return;

  faqQuestions.forEach(question => {
    const btn = document.createElement("button");
    btn.className = "faq-btn";
    btn.textContent = question;
    btn.onclick = () => {
      inputField.value = question;
      sendMessage();
    };
    faqContainer.appendChild(btn);
  });
}

// ========== Toolbar Speaker Toggle ==========

function updateSpeakerIcons(enabled) {
  if (speakerIconOn && speakerIconOff) {
    speakerIconOn.style.display = enabled ? "block" : "none";
    speakerIconOff.style.display = enabled ? "none" : "block";
  }
  if (speakerToggle) {
    speakerToggle.classList.toggle("active", enabled);
  }
}

function toggleSpeaker() {
  isSpeakerEnabled = !isSpeakerEnabled;
  localStorage.setItem("speechEnabled", isSpeakerEnabled);
  updateSpeakerIcons(isSpeakerEnabled);

  if (!isSpeakerEnabled) {
    stopAllSpeech();
  }
}

// ========== Mobile Menu Toggle ==========

function toggleMobileMenu() {
  if (navMenu) {
    navMenu.classList.toggle("active");
  }
  if (hamburger) {
    hamburger.classList.toggle("active");
  }
}

// ========== Location Functions ==========

async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    if (!response.ok) throw new Error("Reverse geocoding failed");

    const data = await response.json();
    const city = data.address.city || data.address.town || data.address.village || data.address.state || "Unknown";
    const state = data.address.state || "";
    const country = data.address.country || "";

    // Create a more detailed location string
    let locationString = city;
    if (state && state !== city) locationString += `, ${state}`;
    if (country) locationString += `, ${country}`;

    // Store both full location and coordinates
    sessionStorage.setItem("userLocation", locationString);
    sessionStorage.setItem("userCoords", JSON.stringify({ lat, lon }));
    sessionStorage.setItem("locationTimestamp", Date.now().toString());

    locationStatus.textContent = `📍 Location: ${locationString}`;
    setLocationBtn.style.display = "none";

    console.log("Location set:", locationString);

    // Show a subtle welcome message if this is first time
    if (!localStorage.getItem("locationSetBefore")) {
      localStorage.setItem("locationSetBefore", "true");
      setTimeout(() => {
        createMessageBubble("bot", `Great! I now know you're in ${locationString}. I can provide location-specific farming advice for your area.`);
      }, 500);
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    locationStatus.textContent = "📍 Could not get location name.";
    setLocationBtn.textContent = "Try Again";
    setLocationBtn.style.display = "inline-block";
    setLocationBtn.disabled = false;
  }
}

function getUserLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  setLocationBtn.disabled = true;
  setLocationBtn.textContent = "Locating...";
  locationStatus.textContent = "📍 Getting your location...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      reverseGeocode(position.coords.latitude, position.coords.longitude);
    },
    (error) => {
      console.error("Geolocation error:", error);
      let errorMsg = "Location access denied.";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = "Location access denied. Click 'Set Location' to try again.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = "Location information unavailable.";
          break;
        case error.TIMEOUT:
          errorMsg = "Location request timed out.";
          break;
      }

      locationStatus.textContent = `📍 ${errorMsg}`;
      setLocationBtn.textContent = "Set Location";
      setLocationBtn.style.display = "inline-block";
      setLocationBtn.disabled = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function checkStoredLocation() {
  const storedLocation = sessionStorage.getItem("userLocation");
  const timestamp = sessionStorage.getItem("locationTimestamp");

  // Check if location is still fresh (less than 24 hours old)
  const isLocationFresh = timestamp && (Date.now() - parseInt(timestamp)) < 24 * 60 * 60 * 1000;

  if (storedLocation && isLocationFresh) {
    locationStatus.textContent = `📍 Location: ${storedLocation}`;
    setLocationBtn.style.display = "none";
    console.log("Using stored location:", storedLocation);
  } else {
    // Location expired or doesn't exist, request new location
    console.log("Location expired or not found, requesting new location...");
    sessionStorage.removeItem("userLocation");
    sessionStorage.removeItem("userCoords");
    sessionStorage.removeItem("locationTimestamp");
    autoRequestLocation();
  }
}

function autoRequestLocation() {
  // Check if we should automatically request location
  if (!navigator.geolocation) {
    console.log("Geolocation not supported");
    return;
  }

  // Check permission status if available
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        // Permission already granted, get location automatically
        console.log("Geolocation permission granted, getting location...");
        getUserLocation();
      } else if (result.state === 'prompt') {
        // Permission not decided, show button but also auto-prompt
        console.log("Geolocation permission prompt, requesting...");
        getUserLocation();
      } else {
        // Permission denied
        console.log("Geolocation permission denied");
        locationStatus.textContent = "📍 Location: Not Set";
        setLocationBtn.style.display = "inline-block";
      }
    }).catch(() => {
      // Permissions API not supported, just try to get location
      console.log("Permissions API not supported, requesting location...");
      getUserLocation();
    });
  } else {
    // Permissions API not supported, just try to get location
    console.log("Permissions API not available, requesting location...");
    getUserLocation();
  }
}

// ========== Event Listeners ==========

if (sendBtn) sendBtn.addEventListener("click", sendMessage);
if (inputField) inputField.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });
if (micBtn) micBtn.addEventListener("click", recordVoice);
if (speakerToggle) speakerToggle.addEventListener("click", toggleSpeaker);
if (hamburger) hamburger.addEventListener("click", toggleMobileMenu);
if (setLocationBtn) setLocationBtn.addEventListener("click", getUserLocation);

// ========== Welcome Greeting ==========

function showWelcomeGreeting() {
  // Check if greeting has already been shown in this session
  if (sessionStorage.getItem("greetingShown")) {
    return;
  }

  const greetingMessages = [
    "Hello! 👋 I'm your AI Farm Assistant. I'm here to help you with crop advice, weather updates, pest management, and more!",
    "Welcome! 🌾 I'm your smart farming companion, ready to answer your agricultural questions and provide expert guidance.",
    "Namaste! 🙏 I'm here to assist you with all your farming needs - from crop selection to soil health and everything in between!"
  ];

  // Randomly select a greeting
  const greeting = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];

  // Get current language for TTS
  const lang = langSelect ? langSelect.value : "en";

  // Create greeting message with special styling
  const messageDiv = document.createElement("div");
  messageDiv.className = "chat-message bot-message welcome-message";

  const content = document.createElement("div");
  content.className = "message-content";

  const p = document.createElement("p");
  p.textContent = greeting;

  content.appendChild(p);
  messageDiv.appendChild(content);
  chatBox.appendChild(messageDiv);

  // Add play button
  addSpeaker(messageDiv, greeting, lang); // Also renamed here to match

  scrollChatToBottom();

  // Mark greeting as shown
  sessionStorage.setItem("greetingShown", "true");
}

// Initialize on load
window.addEventListener("load", () => {
  loadChatHistory();
  initializeFAQ();
  updateSpeakerIcons(isSpeakerEnabled);

  // Show welcome greeting
  showWelcomeGreeting();
  scrollChatToBottom();

  // Check for stored location or auto-request on page load
  checkStoredLocation();
});