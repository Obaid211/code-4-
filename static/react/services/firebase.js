// Firebase Configuration and Auth Service
// Plain JS — no JSX

const firebaseConfig = {
  apiKey: "AIzaSyBwoDk8-2iBHxQ-M14SHOkcUtYyGQrzZIk",
  authDomain: "agroany-b1cb2.firebaseapp.com",
  projectId: "agroany-b1cb2",
  storageBucket: "agroany-b1cb2.appspot.com",
  messagingSenderId: "1076065111877",
  appId: "1:1076065111877:web:539ca28012a3ea3ed2782c",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

const fbAuth = firebase.auth();
const fbDb = firebase.firestore();

const PUBLIC_HASHES = ['#/login', '#/signup', '#/about', '#/contact'];

const FirebaseService = {
  auth: fbAuth,
  db: fbDb,
  currentUser: null,

  // Listen for auth changes — call this once in App
  onAuthChange(callback) {
    return fbAuth.onAuthStateChanged((user) => {
      FirebaseService.currentUser = user;
      callback(user);
    });
  },

  // Sign in
  async signIn(email, password) {
    const cred = await fbAuth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  // Sign up
  async signUp(email, password, name) {
    const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;
    await user.updateProfile({ displayName: name });

    await fbDb.collection('users').doc(user.uid).set({
      name,
      email,
      joinDate: new Date().toISOString(),
      role: 'member',
      subscription: 'free',
      settings: {
        emailNotifications: true,
        weatherAlerts: true,
        marketAlerts: false,
        pestAlerts: true,
      },
      farmInfo: { name: '', location: '', area: 0, crops: '' },
    });

    return user;
  },

  // Sign out
  async signOut() {
    await fbAuth.signOut();
    sessionStorage.removeItem('smartagri_user');
    localStorage.removeItem('smartagri_user');
  },

  // Load user profile from Firestore
  async loadUserProfile(user) {
    if (!user) return null;
    const docRef = fbDb.collection('users').doc(user.uid);
    const doc = await docRef.get();

    if (doc.exists) {
      return doc.data();
    }

    // Create profile if missing
    const newProfile = {
      name: user.displayName || 'New User',
      email: user.email,
      joinDate: new Date().toISOString(),
      role: 'member',
      subscription: 'free',
      settings: {
        emailNotifications: true,
        weatherAlerts: true,
        marketAlerts: false,
        pestAlerts: true,
      },
      farmInfo: { name: '', location: '', area: 0, crops: '' },
    };

    await docRef.set(newProfile);
    return newProfile;
  },

  // Update user profile
  async updateProfile(updates) {
    if (!FirebaseService.currentUser) throw new Error('Not signed in');
    await fbDb.collection('users').doc(FirebaseService.currentUser.uid).update(updates);
  },

  // Update farm info
  async updateFarmInfo(farmInfo) {
    if (!FirebaseService.currentUser) throw new Error('Not signed in');
    await fbDb.collection('users').doc(FirebaseService.currentUser.uid).update({ farmInfo });
  },

  // Update settings
  async updateSettings(settings) {
    if (!FirebaseService.currentUser) throw new Error('Not signed in');
    await fbDb.collection('users').doc(FirebaseService.currentUser.uid).update({ settings });
  },

  // Password reset
  async sendPasswordReset(email) {
    await fbAuth.sendPasswordResetEmail(email);
  },

  // Set persistence
  async setPersistence(remember) {
    const mode = remember
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;
    await fbAuth.setPersistence(mode);
  },

  // Load chat history
  async loadChatHistory() {
    if (!FirebaseService.currentUser) return [];
    const docRef = fbDb.collection('users').doc(FirebaseService.currentUser.uid);
    const doc = await docRef.get();
    if (doc.exists && doc.data().chatHistory) {
      return doc.data().chatHistory;
    }
    return [];
  },

  // Save chat history (keeps last 10 messages)
  async saveChatHistory(messages) {
    if (!FirebaseService.currentUser) return;
    
    // Filter out streaming messages and only keep the last 10
    const historyToSave = messages
      .filter(msg => !msg.streaming)
      .slice(-10);
      
    await fbDb.collection('users').doc(FirebaseService.currentUser.uid).update({
      chatHistory: historyToSave
    });
  },

  // Helper: is page public?
  isPublicPage() {
    const hash = window.location.hash || '#/login';
    return PUBLIC_HASHES.includes(hash);
  },

  // Get friendly error message
  getFriendlyError(code) {
    const messages = {
      'auth/invalid-email': 'Invalid email address format.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email. Please sign up.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
    };
    return messages[code] || 'An error occurred. Please try again.';
  },
};

window.FirebaseService = FirebaseService;
