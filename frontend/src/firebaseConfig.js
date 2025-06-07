// frontend/src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // *** חשוב: הוסף את השורה הזו לייבוא getAuth ***
import { getFirestore } from "firebase/firestore";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app); // *** חשוב: הוסף את השורה הזו לאתחול auth ***

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// *** חשוב: ודא ששורה זו מייצאת גם את auth וגם את db ***
export { auth, db };