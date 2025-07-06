// frontend/src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4ndicXgPWzoV9H6vMiCaJlSKet5r7log",
  authDomain: "magen-dvorim-adom.firebaseapp.com",
  projectId: "magen-dvorim-adom",
  storageBucket: "magen-dvorim-adom.firebasestorage.app",
  messagingSenderId: "789427950312",
  appId: "1:789427950312:web:83628c8b2456933ece2f5d",
  measurementId: "G-ZJYS7780XG"
};

// Initialize Firebase with error handling
let app, auth, db, storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create fallback objects to prevent constructor errors
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };