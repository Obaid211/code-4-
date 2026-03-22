// 🌿 SmartAgri AI - Analyzer Script
// Compatible with analyzer.html

document.addEventListener("DOMContentLoaded", () => {
  // Get all DOM elements
  const uploadBox = document.getElementById("uploadBox");
  const imageInput = document.getElementById("plantImage");
  const previewSection = document.getElementById("previewSection");
  const previewImage = document.getElementById("previewImage");
  const fileName = document.getElementById("fileName");
  const fileSize = document.getElementById("fileSize");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const clearBtn = document.getElementById("clearBtn");
  const resultsSection = document.getElementById("resultsSection");
  const analyzerResult = document.getElementById("analyzerResult");
  const healthScore = document.getElementById("healthScore");
  const scoreText = document.getElementById("scoreText");
  const recommendationsList = document.getElementById("recommendationsList");

  // API Configuration
  const API_URL = "http://localhost:5000/api/analyze_plant";

  // Store current file
  let currentFile = null;

  // Initialize
  if (analyzeBtn) analyzeBtn.disabled = true;

  // ========== DRAG & DROP FUNCTIONALITY ==========
  if (uploadBox) {
    uploadBox.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadBox.classList.add("drag-over");
    });

    uploadBox.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadBox.classList.remove("drag-over");
    });

    uploadBox.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadBox.classList.remove("drag-over");
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleImageUpload(files[0]);
      }
    });

    // Click to upload
    uploadBox.addEventListener("click", (e) => {
      // Don't trigger if clicking on the input itself
      if (e.target !== imageInput) {
        imageInput.click();
      }
    });
  }

  // ========== FILE INPUT CHANGE ==========
  if (imageInput) {
    imageInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleImageUpload(files[0]);
      }
    });
  }

  // ========== HANDLE IMAGE UPLOAD ==========
  function handleImageUpload(file) {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("⚠️ Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert("⚠️ File size must be less than 5MB. Please choose a smaller image.");
      return;
    }

    // Store the file
    currentFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = function (e) {
      if (previewImage) {
        previewImage.src = e.target.result;
      }
    };
    reader.onerror = function () {
      alert("❌ Error reading file. Please try again.");
    };
    reader.readAsDataURL(file);

    // Update UI
    if (previewSection) {
      previewSection.classList.remove("hidden");
      previewSection.style.display = "block";
    }
    if (resultsSection) {
      resultsSection.classList.add("hidden");
      resultsSection.style.display = "none";
    }
    if (fileName) {
      fileName.textContent = `📄 ${file.name}`;
    }
    if (fileSize) {
      fileSize.textContent = `💾 ${(file.size / 1024).toFixed(1)} KB`;
    }
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
    }
  }

  // ========== ANALYZE BUTTON ==========
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
      if (!currentFile) {
        alert("⚠️ Please select an image first!");
        return;
      }

      // Disable button and show loading state
      analyzeBtn.disabled = true;
      const originalText = analyzeBtn.textContent;
      analyzeBtn.textContent = "🔍 Analyzing...";

      // Show results section with loading message
      if (resultsSection) {
        resultsSection.classList.remove("hidden");
        resultsSection.style.display = "block";
      }
      if (analyzerResult) {
        analyzerResult.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <p style="font-size: 1.2rem; color: var(--accent);">🔍 Analyzing your plant image...</p>
            <p style="color: var(--muted); margin-top: 0.5rem;">This may take a few seconds ⏳</p>
          </div>
        `;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append("file", currentFile);

      try {
        // Make API request
        const response = await fetch(API_URL, {
          method: "POST",
          body: formData,
        });

        // Parse response
        const data = await response.json();

        // Check for errors
        if (!response.ok) {
          throw new Error(data.error || data.message || `Server error: ${response.status}`);
        }

        // Display results
        displayResults(data);

      } catch (error) {
        console.error("❌ Analysis Error:", error);
        
        // Show error message
        if (analyzerResult) {
          analyzerResult.innerHTML = `
            <div style="padding: 1.5rem;">
              <p style="color: #ff6b6b; font-size: 1.1rem; margin-bottom: 1rem;">
                ❌ ${error.message}
              </p>
              <p style="color: var(--muted); margin-bottom: 1rem;">
                Unable to analyze the image. Please check:
              </p>
              <ul style="color: var(--muted); margin-left: 1.5rem; line-height: 1.8;">
                <li>Backend server is running at: <code style="background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">${API_URL}</code></li>
                <li>Network connection is stable</li>
                <li>Image file is valid and not corrupted</li>
                <li>API endpoint configuration is correct</li>
              </ul>
              <p style="color: var(--muted); margin-top: 1rem; font-size: 0.9rem;">
                💡 <strong>Tip:</strong> If you're developing locally, make sure your Flask/backend server is running.
              </p>
            </div>
          `;
        }
      } finally {
        // Re-enable button
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = originalText;
      }
    });
  }

  // ========== CLEAR BUTTON ==========
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // Reset file input
      if (imageInput) {
        imageInput.value = "";
      }
      currentFile = null;

      // Hide sections
      if (previewSection) {
        previewSection.classList.add("hidden");
        previewSection.style.display = "none";
      }
      if (resultsSection) {
        resultsSection.classList.add("hidden");
        resultsSection.style.display = "none";
      }

      // Clear content
      if (analyzerResult) {
        analyzerResult.innerHTML = "";
      }
      if (recommendationsList) {
        recommendationsList.innerHTML = "";
      }
      if (healthScore) {
        healthScore.style.width = "0%";
      }
      if (scoreText) {
        scoreText.textContent = "";
      }
      if (fileName) {
        fileName.textContent = "📄 No file selected";
      }
      if (fileSize) {
        fileSize.textContent = "💾 0 KB";
      }

      // Disable analyze button
      if (analyzeBtn) {
        analyzeBtn.disabled = true;
      }
    });
  }

  // ========== DISPLAY RESULTS ==========
  function displayResults(data) {
    if (!resultsSection || !analyzerResult) return;

    resultsSection.classList.remove("hidden");
    resultsSection.style.display = "block";

    // Handle different response formats
    if (data.status === "success" && data.crop) {
      // SmartAgri AI rich format from server.py return
      displayRichResults(data);
    } else if (data.status === "success" && data.confidence !== undefined) {
      // Custom API format
      displayCustomResults(data);
    } else if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
      // Kindwise/PlantNet API format
      displaySuggestionsResults(data);
    } else if (data.result || data.plant_name || data.disease) {
      // Alternative format
      displayAlternativeResults(data);
    } else {
      // No results found
      displayNoResults();
    }

    // Display recommendations
    displayRecommendations(data);
  }

  // ========== RICH API RESULTS (from server.py) ==========
  function displayRichResults(data) {
    const crop = data.crop || {};
    const health = data.health || {};
    
    // Calculate overall confidence using crop probability
    const confidence = Math.min(Math.round((crop.probability || 0) * 100), 100);
    
    // Plant name and common names
    const plantName = crop.name || "Unknown Plant";
    const commonNames = Array.isArray(crop.common_names) 
      ? crop.common_names.join(", ") 
      : crop.common_names || "N/A";
      
    // Health status
    const isHealthy = health.is_healthy;
    let healthStatus = isHealthy ? "🌿 Healthy" : "⚠️ Diseased";
    let diseaseInfo = "";
    
    if (!isHealthy && health.diseases && health.diseases.length > 0) {
      const topDisease = health.diseases[0];
      healthStatus = topDisease.name;
      const diseaseConfidence = Math.round((topDisease.probability || 0) * 100);
      diseaseInfo = ` (Confidence: ${diseaseConfidence}%)`;
    }

    const description = crop.description || "No description available.";

    // Update health score UI
    updateHealthScore(confidence);

    // Display results
    if (analyzerResult) {
      analyzerResult.innerHTML = `
        <p><strong>Confidence Level:</strong> ${confidence}%</p>
        <p><strong>Plant Name:</strong> ${plantName}</p>
        <p><strong>Common Names:</strong> ${commonNames}</p>
        <p><strong>Health Status:</strong> <span style="color: ${isHealthy ? 'var(--accent)' : '#ff6b6b'}">${healthStatus}${diseaseInfo}</span></p>
        <p><strong>Description:</strong> ${description}</p>
      `;
    }
  }

  // ========== CUSTOM API RESULTS ==========
  function displayCustomResults(data) {
    const confidence = Math.min(Math.round(data.confidence || 0), 100);
    const commonNames = Array.isArray(data.common_names) 
      ? data.common_names.join(", ") 
      : data.common_names || "N/A";
    const disease = data.disease || "No visible disease detected";
    const recommendation = data.recommendation || "Keep monitoring your plant regularly.";

    // Update health score
    updateHealthScore(confidence);

    // Display results
    if (analyzerResult) {
      analyzerResult.innerHTML = `
        <p><strong>Confidence Level:</strong> ${confidence}%</p>
        <p><strong>Plant Name(s):</strong> ${commonNames}</p>
        <p><strong>Health Status:</strong> ${disease}</p>
        <p><strong>Expert Advice:</strong> ${recommendation}</p>
      `;
    }
  }

  // ========== SUGGESTIONS API RESULTS ==========
  function displaySuggestionsResults(data) {
    const plant = data.suggestions[0];
    const confidence = Math.min(Math.round((plant.probability || 0) * 100), 100);
    const details = plant.plant_details || {};
    const scientificName = plant.plant_name || details.scientific_name || "Unknown species";
    const commonNames = Array.isArray(details.common_names)
      ? details.common_names.slice(0, 3).join(", ")
      : details.common_names || "N/A";
    
    let description = "No description available.";
    if (details.wiki_description && details.wiki_description.value) {
      description = details.wiki_description.value;
    } else if (details.description) {
      description = details.description;
    }
    
    // Truncate long descriptions
    if (description.length > 400) {
      description = description.substring(0, 400) + "...";
    }

    // Update health score
    updateHealthScore(confidence);

    // Display results
    if (analyzerResult) {
      analyzerResult.innerHTML = `
        <p><strong>Confidence Level:</strong> ${confidence}%</p>
        <p><strong>Scientific Name:</strong> <em>${scientificName}</em></p>
        <p><strong>Common Names:</strong> ${commonNames}</p>
        <p><strong>Description:</strong> ${description}</p>
      `;
    }
  }

  // ========== ALTERNATIVE FORMAT RESULTS ==========
  function displayAlternativeResults(data) {
    const confidence = Math.min(Math.round(data.confidence || 75), 100);
    const plantName = data.plant_name || data.result || "Unknown";
    const disease = data.disease || data.condition || "Healthy";

    updateHealthScore(confidence);

    if (analyzerResult) {
      analyzerResult.innerHTML = `
        <p><strong>Confidence Level:</strong> ${confidence}%</p>
        <p><strong>Plant Identified:</strong> ${plantName}</p>
        <p><strong>Condition:</strong> ${disease}</p>
      `;
    }
  }

  // ========== NO RESULTS FOUND ==========
  function displayNoResults() {
    if (healthScore) healthScore.style.width = "0%";
    if (scoreText) scoreText.textContent = "❌ No Identification";

    if (analyzerResult) {
      analyzerResult.innerHTML = `
        <div style="padding: 1rem;">
          <p style="color: #ff6b6b; font-size: 1.1rem; margin-bottom: 1rem;">
            ❌ Unable to identify the plant from this image
          </p>
          <p style="color: var(--muted); margin-bottom: 0.5rem;">
            <strong>Tips for better results:</strong>
          </p>
          <ul style="color: var(--muted); margin-left: 1.5rem; line-height: 1.8;">
            <li>📸 Take a clear, well-lit photo</li>
            <li>🍃 Focus on leaves, flowers, or distinctive features</li>
            <li>🎯 Ensure the plant fills most of the frame</li>
            <li>☀️ Use natural lighting when possible</li>
            <li>🔄 Try uploading a different angle</li>
          </ul>
        </div>
      `;
    }
  }

  // ========== UPDATE HEALTH SCORE ==========
  function updateHealthScore(confidence) {
    if (healthScore) {
      healthScore.style.width = `${confidence}%`;
    }

    if (scoreText) {
      let status = "";
      let color = "";

      if (confidence >= 80) {
        status = "🌿 High Confidence Match";
        color = "var(--accent)";
      } else if (confidence >= 60) {
        status = "⚠️ Good Match";
        color = "#ffa726";
      } else if (confidence >= 40) {
        status = "⚠️ Possible Match";
        color = "#ff9800";
      } else {
        status = "🚨 Low Confidence";
        color = "#ff6b6b";
      }

      scoreText.textContent = status;
      scoreText.style.color = color;
    }
  }

  // ========== DISPLAY RECOMMENDATIONS ==========
  function displayRecommendations(data) {
    if (!recommendationsList) return;

    recommendationsList.innerHTML = "";

    let tips = [];

    // Extract recommendations from different formats
    if (data.health && data.health.diseases && data.health.diseases.length > 0) {
      const topDisease = data.health.diseases[0];
      if (topDisease.details && topDisease.details.treatment) {
        // Split treatments based on ' • ' delimiter sent from backend
        tips = topDisease.details.treatment.split(" • ").filter(t => t.trim());
      }
    } else if (Array.isArray(data.recommendations)) {
      tips = data.recommendations;
    } else if (typeof data.recommendation === "string") {
      tips = [data.recommendation];
    } else if (data.care_tips) {
      tips = Array.isArray(data.care_tips) ? data.care_tips : [data.care_tips];
    }

    // Default recommendations if none provided
    if (tips.length === 0) {
      tips = [
        "💧 Water early morning or late evening to reduce evaporation",
        "☀️ Ensure 6-8 hours of sunlight daily for optimal growth",
        "🚫 Avoid overwatering - check soil moisture before watering",
        "🌱 Apply organic compost monthly for nutrient-rich soil",
        "🔍 Inspect plants weekly for pests and disease symptoms",
        "✂️ Prune dead leaves promptly to prevent disease spread",
        "🌡️ Maintain optimal temperature range for your crop type",
        "🪴 Ensure proper spacing between plants for air circulation"
      ];
    }

    // Add recommendations to list
    tips.forEach((tip) => {
      const li = document.createElement("li");
      li.textContent = tip;
      recommendationsList.appendChild(li);
    });
  }

  // ========== MOBILE MENU TOGGLE ==========
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });

    // Close menu when clicking links
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove("active");
      }
    });
  }
});