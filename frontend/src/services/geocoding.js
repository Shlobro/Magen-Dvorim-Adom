// src/services/geocoding.js

/**
 * Validates if an address can be geocoded by attempting to convert it to coordinates.
 * Uses browser-based geocoding for free deployment.
 * @param {string} address - The street address
 * @param {string} city - The city name
 * @returns {Promise<{isValid: boolean, coordinates?: {lat: number, lng: number}, error?: string}>}
 */
export const validateAddressGeocoding = async (address, city) => {
  try {
    const fullAddress = `${address.trim()}, ${city.trim()}, Israel`;
    
    // Use OpenStreetMap Nominatim API (free alternative)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&addressdetails=1`
    );
    
    const data = await response.json();

    // Check if geocoding was successful
    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      return {
        isValid: true,
        coordinates: {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        },
      };
    }

    // If no results found
    return {
      isValid: false,
      error: 'לא הצלחנו לאתר את הכתובת במפה. אנא ודא שהכתובת מדויקת ותכלול גם את העיר.',
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      isValid: false,
      error: 'שגיאה בתקשורת עם שירות המיקום. אנא נסה שוב או בדוק את החיבור לאינטרנט.',
    };
  }
};

/**
 * Geocodes an address to coordinates
 * @param {string} address - The full address string
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Israel')}&limit=1`
    );
    
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};
