// frontend/src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3VpXz9rYCiQqaK7nvcN6rD4W25uZtNtw",
  authDomain: "magendovrimadom.firebaseapp.com",
  projectId: "magendovrimadom",
  storageBucket: "magendovrimadom.firebasestorage.app",
  messagingSenderId: "3410485302",
  appId: "1:3410485302:web:0a1aa67ef9372079e33897",
  measurementId: "G-DRYS62FSP3"
};

// Initialize Firebase with error handling
let app, auth, db, storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('✅ Firebase initialized successfully');
  console.log('📦 Storage bucket:', firebaseConfig.storageBucket);
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Create fallback objects to prevent constructor errors
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };