// backend/services/geocodeAddress.js
import axios from 'axios';

// חשוב מאוד: טען את המפתח ממשתני סביבה.
// ודא שקובץ השרת הראשי (לדוגמה, server.js או app.js) טוען את dotenv
// והגדרת את המפתח בקובץ .env בתיקיית ה-backend: Maps_API_KEY=YOUR_API_KEY
const Maps_API_KEY = process.env.Maps_API_KEY; 

export async function geocodeAddress(address) {
  if (!Maps_API_KEY || Maps_API_KEY === 'YOUR_Maps_API_KEY') {
    console.error("Geocoding Service Error: Google Maps API Key is missing or invalid. Please set Maps_API_KEY in your .env file.");
    return null;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: Maps_API_KEY, // השתמש במפתח שנטען ממשתני סביבה
        region: 'il' // אופציונלי: מכוון את התוצאות לישראל
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`Geocoding Service: Successfully geocoded "${address}" to Lat: ${location.lat}, Lng: ${location.lng}`);
      return { lat: location.lat, lng: location.lng }; // מחזיר אובייקט עם lat ו-lng
    } else {
      console.error(`Geocoding API failed for address: "${address}". Status: ${response.data.status}`);
      if (response.data.error_message) {
        console.error(`API Error Message: ${response.data.error_message}`);
      }
      return null;
    }
  } catch (error) {
    console.error("Geocoding Service Error calling Google Geocoding API:", error.message);
    if (error.response) {
      console.error("API Response Data:", error.response.data);
      console.error("API Response Status:", error.response.status);
    }
    return null;
  }
}