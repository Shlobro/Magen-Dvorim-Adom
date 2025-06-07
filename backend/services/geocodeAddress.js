// backend/services/geocodeAddress.js
import axios from 'axios';

// חשוב: החלף במפתח ה-API שלך מ-Google Maps Geocoding API
// מומלץ לטעון זאת ממשתני סביבה (לדוגמה, process.env.Maps_API_KEY)
const Maps_API_KEY = 'YOUR_Maps_API_KEY'; 

export async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: Maps_API_KEY,
        region: 'il' // אופציונלי: מכוון את התוצאות לישראל
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng }; // מחזיר אובייקט עם lat ו-lng
    } else {
      console.error(`Geocoding API status: ${response.data.status}, error_message: ${response.data.error_message || 'N/A'}`);
      return null;
    }
  } catch (error) {
    console.error("שגיאה בקריאה ל-Google Geocoding API:", error.message);
    if (error.response) {
      console.error("נתוני תגובה מ-Google Geocoding API:", error.response.data);
    }
    return null;
  }
}