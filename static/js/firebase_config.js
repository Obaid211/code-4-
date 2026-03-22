// Firebase Configuration and Initialization
// firebase_config.js

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwoDk8-2iBHxQ-M14SHOkcUtYyGQrzZIk",
  authDomain: "agroany-b1cb2.firebaseapp.com",
  projectId: "agroany-b1cb2",
  storageBucket: "agroany-b1cb2.appspot.com",
  messagingSenderId: "1076065111877",
  appId: "1:1076065111877:web:539ca28012a3ea3ed2782c",
};

// Initialize Firebase ONLY if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // Use existing app
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Auth state observer
let currentUser = null;

// Public pages that don't require authentication
const PUBLIC_PAGES = [
  "login.html",
  "signup.html",
  "about.html",
  "contact.html",
];

auth.onAuthStateChanged((user) => {
  currentUser = user;
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  if (user) {
    // User is signed in
    // --- FIX 1: Pass the whole 'user' object, not just the UID ---
    loadUserProfile(user);

    // Redirect to index if on login/signup page
    if (currentPage === "login.html" || currentPage === "signup.html") {
      window.location.href = "index.html";
    }
  } else {
    // User is signed out
    sessionStorage.removeItem("smartagri_user"); // Clear session
    if (!PUBLIC_PAGES.includes(currentPage) && currentPage !== "") {
      window.location.href = "login.html";
    }
  }
});

// --- FIX 2: Modified function to accept the full user object ---
async function loadUserProfile(user) {
  if (!user) return;
  const uid = user.uid;

  try {
    const userDocRef = db.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    let userData;

    if (userDoc.exists) {
      // User document exists, use it
      userData = userDoc.data();
      console.log("User profile loaded from Firestore.");

    } else {
      // --- FIX 3: User document DOESN'T exist. Create it! ---
      console.warn("User document not found for UID:", uid, "Creating one...");
      
      // Use data from Auth profile as a fallback
      const newUserData = {
        name: user.displayName || "New User",
        email: user.email,
        joinDate: new Date().toISOString(),
        role: "member",
        subscription: "free",
        // Default settings (copied from your signUp function)
        settings: {
          emailNotifications: true,
          weatherAlerts: true,
          marketAlerts: false,
          pestAlerts: true,
        },
        farmInfo: {
          name: "",
          location: "",
          area: 0,
          crops: "",
        },
      };

      // Set the new document in Firestore
      await userDocRef.set(newUserData);
      
      // Use this new data
      userData = newUserData;
    }

    // Now, update the UI and session storage with the correct data
    updateUIWithUserData(userData);

    sessionStorage.setItem(
      "smartagri_user",
      JSON.stringify({
        uid: uid,
        ...userData, // Store all data
      })
    );
    
    // Dispatch a custom event to notify other scripts (like profile.html)
    // that the user data is ready.
    window.dispatchEvent(new CustomEvent('userLoaded', { detail: userData }));

  } catch (error) {
    console.error("Error loading user profile:", error);
  }
}

// Update UI elements with user data
// This function is now the single source of truth for UI updates
function updateUIWithUserData(userData) {
  if (!userData) return;

  // Update user name displays
  const userNameDisplays = document.querySelectorAll(
    "#userNameDisplay, .user-name-display"
  );
  const firstName = userData.name ? userData.name.split(" ")[0] : "User";
  userNameDisplays.forEach((el) => {
    if (el) el.textContent = firstName;
  });

  // Update dropdown info
  const dropdownUserName = document.getElementById("dropdownUserName");
  const dropdownUserEmail = document.getElementById("dropdownUserEmail");
  if (dropdownUserName)
    dropdownUserName.textContent = userData.name || "User Name";
  if (dropdownUserEmail) dropdownUserEmail.textContent = userData.email || "";

  // Update welcome message
  const welcomeMessage = document.getElementById("welcomeMessage");
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome back, ${firstName}! 👋`;
  }
}

// Sign in with email and password
async function signIn(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: error.message };
  }
}

// Sign up with email and password (from signup.html)
async function signUp(email, password, name) {
  try {
    // Create user account
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    // Update profile
    await user.updateProfile({
      displayName: name,
    });

    // Create user document in Firestore
    await db
      .collection("users")
      .doc(user.uid)
      .set({
        name: name,
        email: email,
        joinDate: new Date().toISOString(),
        role: "member",
        subscription: "free",
        settings: {
          emailNotifications: true,
          weatherAlerts: true,
          marketAlerts: false,
          pestAlerts: true,
        },
        farmInfo: {
          name: "",
          location: "",
          area: 0,
          crops: "",
        },
      });

    return { success: true, user: user };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: error.message };
  }
}

// Sign out
async function signOut() {
  try {
    await auth.signOut();
    sessionStorage.removeItem("smartagri_user");
    localStorage.removeItem("smartagri_user");
    window.location.href = "login.html";
  } catch (error) {
    console.error("Sign out error:", error);
  }
}

// Update user profile
async function updateUserProfile(updates) {
  if (!currentUser) return { success: false, error: "No user signed in" };

  try {
    await db.collection("users").doc(currentUser.uid).update(updates);
    
    // Manually update session storage
    const user = JSON.parse(sessionStorage.getItem("smartagri_user") || "{}");
    const updatedUser = { ...user, ...updates };
    sessionStorage.setItem("smartagri_user", JSON.stringify(updatedUser));
    
    // Re-run the UI update
    updateUIWithUserData(updatedUser);

    return { success: true };
  } catch (error)
 {
    console.error("Update profile error:", error);
    return { success: false, error: error.message };
  }
}

// Update farm information
async function updateFarmInfo(farmInfo) {
  if (!currentUser) return { success: false, error: "No user signed in" };

  try {
    await db.collection("users").doc(currentUser.uid).update({
      farmInfo: farmInfo,
    });
    
    // Manually update session storage
    const user = JSON.parse(sessionStorage.getItem("smartagri_user") || "{}");
    user.farmInfo = farmInfo;
    sessionStorage.setItem("smartagri_user", JSON.stringify(user));

    return { success: true };
  } catch (error) {
    console.error("Update farm info error:", error);
    return { success: false, error: error.message };
  }
}

// Update user settings
async function updateSettings(settings) {
  if (!currentUser) return { success: false, error: "No user signed in" };

  try {
    await db.collection("users").doc(currentUser.uid).update({
      settings: settings,
    });

    const user = JSON.parse(sessionStorage.getItem("smartagri_user") || "{}");
    user.settings = settings;
    sessionStorage.setItem("smartagri_user", JSON.stringify(user));

    return { success: true };
  } catch (error) {
    console.error("Update settings error:", error);
    return { success: false, error: error.message };
  }
}

// Get current user data
function getCurrentUser() {
  return currentUser;
}

// Export functions for use in other scripts
window.firebaseAuth = {
  signIn,
  signUp,
  signOut,
  updateUserProfile,
  updateFarmInfo,
  updateSettings,
  getCurrentUser,
  auth,
  db,
};