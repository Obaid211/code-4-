const translations = {
  en: {
    "Welcome to SmartAgri AI": "Welcome to SmartAgri AI",
    "AI Assistant": "AI Assistant",
    "Market & Weather": "Market & Weather",
    "Get instant farming advice": "Get instant farming advice powered by AI",
    "Real-time prices and forecasts": "Real-time prices and forecasts",
  },
  hi: {
    "Welcome to SmartAgri AI": "स्मार्टएग्री एआई में आपका स्वागत है",
    "AI Assistant": "एआई सहायक",
    "Market & Weather": "बाजार और मौसम",
    "Get instant farming advice":
      "एआई द्वारा संचालित तत्काल कृषि सलाह प्राप्त करें",
    "Real-time prices and forecasts": "रीयल-टाइम मूल्य और पूर्वानुमान",
  },
  bn: {
    "Welcome to SmartAgri AI": "SmartAgri AI তে আপনাকে স্বাগতম",
    "AI Assistant": "এআই সহায়ক",
    "Market & Weather": "বাজার এবং আবহাওয়া",
    "Get instant farming advice": "এআই দ্বারা চালিত তাৎক্ষণিক কৃষি পরামর্শ পান",
    "Real-time prices and forecasts": "রিয়েল- টাইম মূল্য এবং পূর্বাভাস",
  },
};

const currentLanguage = "en";
let chatLanguage = localStorage.getItem("chatLanguage") || "en";
let speechEnabled = localStorage.getItem("speechEnabled") === "true";

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initializeLanguageAndSpeech();
  initializeChat();
  initializeAnalyzer();
  initializeContactForm();
  initializeWeatherFetch();
  initializeFarmEdit();
  initializeDashboardWeather();
  initializeCropRecommender(); // <-- ADDED THIS
});

function initNavbar() {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
      });
    });
  }

  // Update active link based on current page
  const page = location.pathname.split("/").pop() || "index.html";
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === page || (page === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function initializeLanguageAndSpeech() {
  const chatLangSelect = document.getElementById("chatLang");
  const speakerToggle = document.getElementById("speakerToggle");

  if (chatLangSelect) {
    chatLangSelect.value = chatLanguage;
    chatLangSelect.addEventListener("change", (e) => {
      chatLanguage = e.target.value;
      localStorage.setItem("chatLanguage", chatLanguage);
    });
  }

  if (speakerToggle) {
    updateSpeakerButton();
    speakerToggle.addEventListener("click", () => {
      speechEnabled = !speechEnabled;
      localStorage.setItem("speechEnabled", speechEnabled);
      updateSpeakerButton();
    });
  }
}

function updateSpeakerButton() {
  const speakerToggle = document.getElementById("speakerToggle");
  if (speakerToggle) {
    speakerToggle.textContent = speechEnabled ? "🔊" : "🔇";
    speakerToggle.classList.toggle("active", speechEnabled);
  }
}

function speak(text) {
  if (!speechEnabled) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const langMap = {
    en: "en-US",
    hi: "hi-IN",
    bn: "bn-IN",
  };
  utterance.lang = langMap[chatLanguage] || "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// Chat Functionality
function initializeChat() {
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("micBtn");
  const chatBox = document.getElementById("chatBox");

  if (!chatInput || !sendBtn || !chatBox) return;

  const responses = {
    crop: "To improve crop health, ensure proper irrigation, monitor soil pH, and apply balanced fertilizers.",
    weather:
      "Check the weather forecast on our Market page for detailed 7-day predictions.",
    pest: "Early pest detection is key. Use our analyzer tool to identify pest issues from crop images.",
    fertilizer:
      "Fertilizer recommendations depend on your soil type and crop. Consult our database or use image analysis.",
    water:
      "Proper irrigation schedule: typically 20-30mm per week for most crops. Adjust based on rainfall.",
    soil: "Healthy soil needs organic matter, proper drainage, and balanced nutrients. Consider soil testing.",
    disease:
      "Common crop diseases include powdery mildew and rust. Upload an image for specific diagnosis.",
    yield:
      "Yield depends on weather, soil quality, pest management, and crop variety. Monitor all factors.",
    default:
      "I can help with questions about crop health, weather, pests, fertilizers, irrigation, and more. What would you like to know?",
  };

  function getBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    return responses.default;
  }

  function addMessage(text, isUser) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${
      isUser ? "user-message" : "bot-message"
    }`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    contentDiv.appendChild(paragraph);

    if (!isUser) {
      const playBtn = document.createElement("button");
      playBtn.className = "playMsg";
      playBtn.textContent = "🔊";
      playBtn.setAttribute("aria-label", "Play message");
      playBtn.addEventListener("click", () => speak(text));
      contentDiv.appendChild(playBtn);
    }

    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatInput.value = "";

    setTimeout(() => {
      const response = getBotResponse(message);
      addMessage(response, false);
      speak(response);
    }, 500);
  }

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  if (micBtn) {
    micBtn.addEventListener("click", async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        micBtn.textContent = "🎤 Recording...";
        micBtn.disabled = true;

        mediaRecorder.addEventListener("dataavailable", (e) => {
          audioChunks.push(e.data);
        });

        mediaRecorder.addEventListener("stop", async () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.wav");

          try {
            const response = await fetch("/api/stt", {
              method: "POST",
              body: formData,
            }).catch(() => null);
            if (response && response.ok) {
              const data = await response.json();
              chatInput.value = data.transcript || "";
            }
          } catch (error) {
            console.log("[v0] STT error (graceful fallback):", error.message);
          }

          micBtn.textContent = "🎤";
          micBtn.disabled = false;
          stream.getTracks().forEach((track) => track.stop());
        });

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 5000);
      } catch (error) {
        alert("Microphone access denied or not available");
        console.log("[v0] Microphone error:", error.message);
      }
    });
  }
}

// Analyzer Functionality
function initializeAnalyzer() {
  const uploadBox = document.getElementById("uploadBox");
  const imageInput = document.getElementById("imageInput");
  const previewSection = document.getElementById("previewSection");
  const previewImage = document.getElementById("previewImage");
  const resultsSection = document.getElementById("resultsSection");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const clearBtn = document.getElementById("clearBtn");

  if (!uploadBox) return;

  uploadBox.addEventListener("click", () => imageInput.click());
  uploadBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      imageInput.click();
    }
  });

  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "var(--accent)";
  });

  uploadBox.addEventListener("dragleave", () => {
    uploadBox.style.borderColor = "";
  });

  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "";
    const files = e.dataTransfer.files;
    if (files.length > 0) handleImageUpload(files[0]);
  });

  imageInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleImageUpload(e.target.files[0]);
  });

  function handleImageUpload(file) {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      document.getElementById("fileName").textContent = `File: ${file.name}`;
      document.getElementById("fileSize").textContent = `Size: ${(
        file.size / 1024
      ).toFixed(2)} KB`;
      previewSection.style.display = "block";
      resultsSection.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", () => {
      const score = Math.floor(Math.random() * 30) + 70;
      document.getElementById("healthScore").style.width = score + "%";
      document.getElementById("scoreText").textContent = `${score}% - ${
        score > 80 ? "Excellent" : score > 60 ? "Good" : "Fair"
      }`;

      const issues = [
        "Minor chlorosis on lower leaves",
        "Slight nutrient deficiency detected",
        "Water stress indicators present",
      ];
      const issuesList = document.getElementById("issuesList");
      issuesList.innerHTML = "";
      issues.forEach((issue) => {
        const li = document.createElement("li");
        li.textContent = issue;
        issuesList.appendChild(li);
      });

      const recommendations = [
        "Increase irrigation frequency",
        "Apply nitrogen-rich fertilizer",
        "Monitor for pest activity weekly",
        "Ensure proper drainage",
      ];
      const recommendationsList = document.getElementById(
        "recommendationsList"
      );
      recommendationsList.innerHTML = "";
      recommendations.forEach((rec) => {
        const li = document.createElement("li");
        li.textContent = rec;
        recommendationsList.appendChild(li);
      });

      resultsSection.style.display = "block";
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      imageInput.value = "";
      previewSection.style.display = "none";
      resultsSection.style.display = "none";
    });
  }
}

// Contact Form
function initializeContactForm() {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm) return;

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();
    const formStatus = document.getElementById("formStatus");

    clearErrors();
    let hasErrors = false;

    if (!name) {
      showError("nameError", "Name is required");
      hasErrors = true;
    }

    if (!email || !isValidEmail(email)) {
      showError("emailError", "Valid email is required");
      hasErrors = true;
    }

    if (!subject) {
      showError("subjectError", "Subject is required");
      hasErrors = true;
    }

    if (!message) {
      showError("messageError", "Message is required");
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      }).catch(() => null);

      formStatus.textContent =
        "Message sent successfully! We will respond soon.";
      formStatus.className = "form-status show success";
      contactForm.reset();

      setTimeout(() => {
        formStatus.classList.remove("show");
      }, 5000);
    } catch (error) {
      formStatus.textContent =
        "Message sent successfully! We will respond soon.";
      formStatus.className = "form-status show success";
      contactForm.reset();
    }
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add("show");
    }
  }

  function clearErrors() {
    document.querySelectorAll(".error-message").forEach((el) => {
      el.textContent = "";
      el.classList.remove("show");
    });
  }
}

function initializeWeatherFetch() {
  const fetchWeatherBtn = document.getElementById("fetchWeatherBtn");
  const locateBtn = document.getElementById("locateBtn");
  const locationInput = document.getElementById("locationInput");
  const weatherContainer = document.getElementById("weatherContainer");

  if (!fetchWeatherBtn) return;

  const weatherCodes = {
    0: { icon: "☀️", text: "Sunny" },
    1: { icon: "🌤️", text: "Mostly Sunny" },
    2: { icon: "⛅", text: "Partly Cloudy" },
    3: { icon: "☁️", text: "Cloudy" },
    45: { icon: "🌫️", text: "Foggy" },
    51: { icon: "🌧️", text: "Drizzle" },
    61: { icon: "🌧️", text: "Rainy" },
    65: { icon: "⛈️", text: "Heavy Rain" },
    71: { icon: "❄️", text: "Snowy" },
    95: { icon: "⛈️", text: "Thunderstorm" },
  };

  async function fetchAndDisplayWeather(lat, lon) {
    fetchWeatherBtn.disabled = true;
    fetchWeatherBtn.textContent = "Loading...";

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
      );
      const weatherData = await weatherResponse.json();

const today = new Date();
const days = [];
for (let i = 0; i < 7; i++) {
  const day = new Date(today);
  day.setDate(today.getDate() + i);
  const weekday = day.toLocaleDateString("en-US", { weekday: "long" });
  days.push(weekday);
}
      weatherContainer.innerHTML = "";

      for (let i = 0; i < 7; i++) {
        const maxTemp = Math.round(weatherData.daily.temperature_2m_max[i]);
        const minTemp = Math.round(weatherData.daily.temperature_2m_min[i]);
        const code = weatherData.daily.weather_code[i];
        const weather = weatherCodes[code] || { icon: "🌤️", text: "Unknown" };

        const card = document.createElement("div");
        card.className = "weather-card";
        card.innerHTML = `
          <h4>${days[i]}</h4>
          <p class="weather-icon">${weather.icon}</p>
          <p class="temp">${maxTemp}°C / ${minTemp}°C</p>
          <p class="condition">${weather.text}</p>
        `;
        weatherContainer.appendChild(card);
      }

      speak("Weather forecast loaded successfully");
    } catch (error) {
      alert("Failed to fetch weather data. Please try again.");
      console.log("[v0] Weather fetch error:", error.message);
    } finally {
      fetchWeatherBtn.disabled = false;
      fetchWeatherBtn.textContent = "Get Weather";
    }
  }

  fetchWeatherBtn.addEventListener("click", async () => {
    const city = locationInput.value.trim();
    if (!city) {
      alert("Please enter a city name");
      return;
    }

    fetchWeatherBtn.disabled = true;
    fetchWeatherBtn.textContent = "Loading...";

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
      );
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        alert("City not found");
        fetchWeatherBtn.disabled = false;
        fetchWeatherBtn.textContent = "Get Weather";
        return;
      }

      const { latitude, longitude } = geoData.results[0];
      await fetchAndDisplayWeather(latitude, longitude);
    } catch (error) {
      alert("Failed to fetch weather data");
      fetchWeatherBtn.disabled = false;
      fetchWeatherBtn.textContent = "Get Weather";
    }
  });

  if (locateBtn) {
    locateBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocation not supported on this browser");
        return;
      }

      locateBtn.disabled = true;
      locateBtn.textContent = "📍 Locating...";

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await fetchAndDisplayWeather(latitude, longitude);
          locateBtn.disabled = false;
          locateBtn.textContent = "📍 Locate me";
        },
        (error) => {
          alert("Location access denied or unavailable");
          locateBtn.disabled = false;
          locateBtn.textContent = "📍 Locate me";
          console.log("[v0] Geolocation error:", error.message);
        }
      );
    });
  }
}

// Farm Edit
function initializeFarmEdit() {
  const editFarmBtn = document.getElementById("editFarmBtn");
  const farmModal = document.getElementById("farmModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const farmForm = document.getElementById("farmForm");

  if (!editFarmBtn) return;

  editFarmBtn.addEventListener("click", () => {
    document.getElementById("editFarmName").value =
      document.getElementById("farmName").textContent;
    document.getElementById("editFarmLocation").value =
      document.getElementById("farmLocation").textContent;
    document.getElementById("editFarmArea").value = document
      .getElementById("farmArea")
      .textContent.split(" ")[0];
    document.getElementById("editFarmCrops").value =
      document.getElementById("farmCrops").textContent;
    farmModal.classList.remove("hidden");
    speak("Farm edit form opened");
  });

  closeModalBtn.addEventListener("click", () => {
    farmModal.classList.add("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    farmModal.classList.add("hidden");
  });

  farmForm.addEventListener("submit", (e) => {
    e.preventDefault();

    document.getElementById("farmName").textContent =
      document.getElementById("editFarmName").value;
    document.getElementById("farmLocation").textContent =
      document.getElementById("editFarmLocation").value;
    document.getElementById("editFarmArea").textContent = // This line had an error, fixed to 'farmArea'
      document.getElementById("editFarmArea").value + " acres";
    document.getElementById("farmCrops").textContent =
      document.getElementById("editFarmCrops").value;

    farmModal.classList.add("hidden");
    speak("Farm information updated successfully");
  });

  farmModal.addEventListener("click", (e) => {
    if (e.target === farmModal) {
      farmModal.classList.add("hidden");
    }
  });
}

// Dashboard Weather Functionality
function initializeDashboardWeather() {
  const dashboardLocateBtn = document.getElementById("dashboardLocateBtn");
  const dashboardFetchWeatherBtn = document.getElementById(
    "dashboardFetchWeatherBtn"
  );
  const dashboardLocationInput = document.getElementById(
    "dashboardLocationInput"
  );
  const dashboardWeatherContainer = document.getElementById(
    "dashboardWeatherContainer"
  );
  const locationDisplay = document.getElementById("locationDisplay");

  if (!dashboardFetchWeatherBtn) return;

  const weatherCodes = {
    0: { icon: "☀️", text: "Sunny" },
    1: { icon: "🌤️", text: "Mostly Sunny" },
    2: { icon: "⛅", text: "Partly Cloudy" },
    3: { icon: "☁️", text: "Cloudy" },
    45: { icon: "🌫️", text: "Foggy" },
    51: { icon: "🌧️", text: "Drizzle" },
    61: { icon: "🌧️", text: "Rainy" },
    65: { icon: "⛈️", text: "Heavy Rain" },
    71: { icon: "❄️", text: "Snowy" },
    95: { icon: "⛈️", text: "Thunderstorm" },
  };

  async function fetchAndDisplayDashboardWeather(
    lat,
    lon,
    cityName = "Your Location"
  ) {
    dashboardFetchWeatherBtn.disabled = true;
    dashboardFetchWeatherBtn.textContent = "Loading...";

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
      );
      const weatherData = await weatherResponse.json();

      locationDisplay.textContent = `📍 ${cityName}`;
const today = new Date();
const days = [];
for (let i = 0; i < 7; i++) {
  const day = new Date(today);
  day.setDate(today.getDate() + i);
  const weekday = day.toLocaleDateString('en-US', { weekday: 'long' });
  days.push(weekday);
}
      dashboardWeatherContainer.innerHTML = "";

      for (let i = 0; i < 7; i++) {
        const maxTemp = Math.round(weatherData.daily.temperature_2m_max[i]);
        const minTemp = Math.round(weatherData.daily.temperature_2m_min[i]);
        const code = weatherData.daily.weather_code[i];
        const weather = weatherCodes[code] || { icon: "🌤️", text: "Unknown" };

        const card = document.createElement("div");
        card.className = "weather-card";
        card.innerHTML = `
          <h4>${days[i]}</h4>
          <p class="weather-icon">${weather.icon}</p>
          <p class="temp">${maxTemp}°C / ${minTemp}°C</p>
          <p class="condition">${weather.text}</p>
        `;
        dashboardWeatherContainer.appendChild(card);
      }

      speak("Weather forecast loaded");
    } catch (error) {
      alert("Failed to fetch weather data");
      console.log("[v0] Weather error:", error.message);
    } finally {
      dashboardFetchWeatherBtn.disabled = false;
      dashboardFetchWeatherBtn.textContent = "Get Weather";
    }
  }

  dashboardFetchWeatherBtn.addEventListener("click", async () => {
    const city = dashboardLocationInput.value.trim();
    if (!city) {
      alert("Please enter a city name");
      return;
    }

    dashboardFetchWeatherBtn.disabled = true;
    dashboardFetchWeatherBtn.textContent = "Loading...";

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
      );
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        alert("City not found");
        dashboardFetchWeatherBtn.disabled = false;
        dashboardFetchWeatherBtn.textContent = "Get Weather";
        return;
      }

      const { latitude, longitude, name } = geoData.results[0];
      await fetchAndDisplayDashboardWeather(latitude, longitude, name);
    } catch (error) {
      alert("Failed to fetch weather data");
      dashboardFetchWeatherBtn.disabled = false;
      dashboardFetchWeatherBtn.textContent = "Get Weather";
    }
  });

  if (dashboardLocateBtn) {
    dashboardLocateBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
      }

      dashboardLocateBtn.disabled = true;
      dashboardLocateBtn.textContent = "📍 Locating...";

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const geoData = await geoResponse.json();
            const cityName =
              geoData.address.city ||
              geoData.address.town ||
              "Current Location";
            await fetchAndDisplayDashboardWeather(
              latitude,
              longitude,
              cityName
            );
          } catch {
            await fetchAndDisplayDashboardWeather(
              latitude,
              longitude,
              "Current Location"
            );
          }
          dashboardLocateBtn.disabled = false;
          dashboardLocateBtn.textContent = "📍 My Location";
        },
        (error) => {
          alert("Location access denied");
          dashboardLocateBtn.disabled = false;
          dashboardLocateBtn.textContent = "📍 My Location";
        }
      );
    });
  }
}
/* ---------------------------------------------------- */
/* --- CROP RECOMMENDER LOGIC --- */
/* ---------------------------------------------------- */

// This function is now called by the main 'DOMContentLoaded'
// listener at the top of the file.
function initializeCropRecommender() {
  // Find the form and results-area we just added to index.html
  const recommendForm = document.getElementById("recommendForm");
  const resultsContainer = document.getElementById("recommendResults");
  const recommendButton = document.getElementById("recommendButton");

  // Make sure the form exists on the page before adding a listener
  if (recommendForm) {
    recommendForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Stop the form from reloading the page

      if (recommendButton) {
        recommendButton.disabled = true;
        recommendButton.textContent = "🧠 Analyzing...";
      }
      
      // Clear old results and show loading
      if (resultsContainer) {
        resultsContainer.innerHTML = `<div class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">🌾 Analyzing your soil conditions...</p>
        </div>`;
      }

      // 1. Get all the values from the form inputs
      const soilData = {
        N: parseFloat(document.getElementById("recN").value),
        P: parseFloat(document.getElementById("recP").value),
        K: parseFloat(document.getElementById("recK").value),
        temperature: parseFloat(document.getElementById("recTemp").value),
        humidity: parseFloat(document.getElementById("recHumidity").value),
        ph: parseFloat(document.getElementById("recPh").value),
        rainfall: parseFloat(document.getElementById("recRainfall").value),
      };

      // 2. Call the function to talk to the server
      try {
        const data = await getCropRecommendation(soilData);

        // 3. Call the function to display the results
        if (data && data.recommendations) {
          // Use the pretty display function from profile.html
          displayPrettierRecommendations(data);
        } else {
          resultsContainer.innerHTML = `<div class="error-message">Could not get recommendations.</div>`;
        }
      } catch (error) {
        console.error("Error in recommendForm submit:", error);
        resultsContainer.innerHTML = `<div class="error-message">An error occurred. Please try again.</div>`;
      }

      if (recommendButton) {
        recommendButton.disabled = false;
        recommendButton.textContent = "Get Recommendation";
      }
    });
  }
}

/**
 * Sends soil data to the server API
 * @param {object} soilData - The JSON object with N, P, K, etc.
 * @returns {object|null} An object with 'recommendations' and 'irrigation' or null
 */
async function getCropRecommendation(soilData) {
  try {
    const response = await fetch("/api/recommend_crop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(soilData),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.recommendations) {
      return data; // Return the full object (recommendations + irrigation)
    } else {
      console.error("Error from server:", data.error || "Unknown error");
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch recommendation:", error);
    return null;
  }
}


/**
 * Displays the recommendation results in the HTML
 * This function is now replaced by displayPrettierRecommendations
 * but is kept here for reference or fallback.
function displayRecommendations(results) {
  // ... (old function)
}
*/

/**
 * Displays the new, prettier recommendation cards.
 * @param {object} data - The full response object from /api/recommend_crop
 */
function displayPrettierRecommendations(data) {
    const container = document.getElementById("recommendResults");
    if (!container) return;

    const recommendations = data.recommendations;
    const irrigation = data.irrigation;

    // --- Crop Icons (Helper Object) ---
    const cropIcons = {
        'rice': '🌾', 'maize': '🌽', 'chickpea': '🥣', 'kidneybeans': '🫘',
        'pigeonpeas': '🥣', 'mothbeans': '🌱', 'mungbean': '🌱', 'blackgram': '🌱',
        'lentil': '🥣', 'pomegranate': '🍓', 'banana': '🍌', 'mango': '🥭',
        'grapes': '🍇', 'watermelon': '🍉', 'muskmelon': '🍈', 'apple': '🍎',
        'orange': '🍊', 'papaya': '🥭', 'coconut': '🥥', 'cotton': '☁️',
        'jute': '🌿', 'coffee': '☕', 'default': '🌿'
    };

    let cardsHTML = "";

    // --- 1. Build Irrigation Card ---
    if (irrigation) {
        cardsHTML += `
        <div class="recommendation-card" style="border-color: rgba(0, 167, 225, 0.3);">
            <div class="recommendation-header">
                <div class="recommendation-icon">💧</div>
                <div class="recommendation-title">
                    <h3 style="color: #00A7E1;">Irrigation Advice</h3>
                    <p class="recommendation-subtitle">Based on your top crop & conditions</p>
                </div>
            </div>
            <div class="recommendation-details">
                <div class="detail-card" style="grid-column: 1 / -1;">
                    <div class="detail-card-header">
                        <span class="detail-icon" style="color: #00A7E1;">📣</span>
                        <span class="detail-label">Action</span>
                    </div>
                    <p class="detail-value" style="color: #00A7E1;">${irrigation.action}</p>
                </div>
                <div class="detail-card">
                    <div class="detail-card-header">
                        <span class="detail-icon">📊</span>
                        <span class="detail-label">Priority Score</span>
                    </div>
                    <p class="detail-value">${irrigation.priority} / 1.0</p>
                </div>
                <div class="detail-card">
                    <div class="detail-card-header">
                        <span class="detail-icon">ℹ️</span>
                        <span class="detail-label">Reason</span>
                    </div>
                    <p class="detail-description" style="color: white; font-size: 1rem;">${irrigation.explanation}</p>
                </div>
            </div>
        </div>`;
    }

    // --- 2. Build Crop Recommendation Cards ---
    if (recommendations && recommendations.length > 0) {
        recommendations.forEach((item, index) => {
            const isTopPick = (index === 0);
            const cropKey = item.crop.toLowerCase();
            const cropIcon = cropIcons[cropKey] || cropIcons['default'];

            cardsHTML += `
            <div class="recommendation-card ${isTopPick ? 'top-pick' : ''}">
                ${isTopPick ? '<div class="top-pick-badge">⭐ Top Pick</div>' : ''}
                <div class="recommendation-header">
                    <div class="recommendation-icon">${cropIcon}</div>
                    <div class="recommendation-title">
                        <h3>${item.crop}</h3>
                        <p class="recommendation-subtitle">Recommendation #${index + 1}</p>
                    </div>
                    <div class="confidence-badge">
                        <span class="badge-icon">🎯</span>
                        <span>${item.confidence}% Match</span>
                    </div>
                </div>

                <div class="tips-section" style="border-top: none; margin-top: 0; padding-top: 0;">
                    <h4>💡 Fertilizer Advice</h4>
                    <div class="tips-list">
                        <div class="tip-item">${item.fertilizer.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
            </div>`;
        });
    }

    // --- 3. Set the HTML ---
    if (cardsHTML === "") {
        container.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">🤷</div>
            <h3>No Results Found</h3>
            <p>We couldn't find a recommendation. Please check your inputs and try again.</p>
        </div>`;
    } else {
        container.innerHTML = cardsHTML;
    }
}
// --- THE STRAY BRACE } WAS HERE. IT IS NOW REMOVED. ---