// frontend/src/firebaseConfig.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // אופציונלי, רק אם אתה משתמש ב-Analytics
import { getFirestore } from "firebase/firestore"; // *** זה חסר! ***

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
// const analytics = getAnalytics(app); // אופציונלי, רק אם אתה משתמש ב-Analytics

// Initialize Cloud Firestore and get a reference to the service
// *** ודא ששורה זו קיימת ומיוצאת! ***
export const db = getFirestore(app);