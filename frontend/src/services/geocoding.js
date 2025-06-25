// src/services/geocoding.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

/**
 * Validates if an address can be geocoded by attempting to convert it to coordinates.
 * @param {string} address - The street address
 * @param {string} city - The city name
 * @returns {Promise<{isValid: boolean, coordinates?: {lat: number, lng: number}, error?: string}>}
 */
export const validateAddressGeocoding = async (address, city) => {
  try {
    const response = await axios.post(`${API_BASE}/api/geocode`, {
      address: address.trim(),
      city: city.trim(),
    });

    // Check if geocoding was successful
    if (response.data.lat && response.data.lng) {
      return {
        isValid: true,
        coordinates: {
          lat: response.data.lat,
          lng: response.data.lng,
        },
      };
    }

    // Check if explicitly marked as not found
    if (response.data.found === false) {
      return {
        isValid: false,
        error: 'לא הצלחנו לאתר את הכתובת במפה. אנא ודא שהכתובת מדויקת ותכלול גם את העיר.',
      };
    }

    // Fallback for unexpected response format
    return {
      isValid: false,
      error: 'לא הצלחנו לאתר את הכתובת במפה. אנא ודא שהכתובת מדויקת.',
    };
  } catch (error) {
    console.error('Geocoding validation error:', error);
    
    // Handle different types of errors
    if (error.response?.status === 400) {
      return {
        isValid: false,
        error: 'כתובת לא תקינה. אנא וודא שמילאת את שדות הכתובת והעיר.',
      };
    }
    
    return {
      isValid: false,
      error: 'שגיאה בבדיקת הכתובת. אנא נסה שוב מאוחר יותר.',
    };
  }
};
