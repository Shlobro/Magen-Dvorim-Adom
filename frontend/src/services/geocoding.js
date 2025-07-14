// src/services/geocoding.js

/**
 * Validates if an address can be geocoded by attempting to convert it to coordinates.
 * Uses browser-based geocoding for free deployment.
 * @param {string} address - The street address
 * @param {string} city - The city name
 * @returns {Promise<{isValid: boolean, coordinates?: {lat: number, lng: number}, error?: string, suggestion?: string}>}
 */
export const validateAddressGeocoding = async (address, city) => {
  try {
    const fullAddress = `${address.trim()}, ${city.trim()}, Israel`;
    
    // Use OpenStreetMap Nominatim API with enhanced parameters
    const params = new URLSearchParams({
      format: 'json',
      q: fullAddress,
      limit: '3', // Get more results for better validation
      addressdetails: '1',
      countrycodes: 'il', // Limit to Israel
      'accept-language': 'he,en'
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'MagenDvorimAdom/1.0 (bee-rescue@example.com)', // Required by Nominatim
        },
      }
    );
    
    const data = await response.json();

    // Check if geocoding was successful
    if (data && data.length > 0) {
      const bestResult = data[0];
      
      // Validate coordinates are in Israel (approximate bounds)
      const lat = parseFloat(bestResult.lat);
      const lng = parseFloat(bestResult.lon);
      
      if (lat >= 29.0 && lat <= 34.0 && lng >= 34.0 && lng <= 36.0) {
        // Check if the returned address is significantly different (suggests wrong street name)
        const returnedAddress = bestResult.display_name;
        const inputStreet = address.trim().toLowerCase();
        
        // Look for suggestions if the result seems off
        let suggestion = null;
        if (data.length > 1) {
          // Check if there's a better match with a similar street name
          for (let i = 1; i < Math.min(data.length, 3); i++) {
            const altResult = data[i];
            const altLat = parseFloat(altResult.lat);
            const altLng = parseFloat(altResult.lon);
            
            if (altLat >= 29.0 && altLat <= 34.0 && altLng >= 34.0 && altLng <= 36.0) {
              const altAddress = altResult.display_name;
              // Extract street name from the alternative
              const addressParts = altResult.address;
              if (addressParts && (addressParts.road || addressParts.street)) {
                const suggestedStreet = addressParts.road || addressParts.street;
                suggestion = `האם התכוונת ל"${suggestedStreet}"?`;
                break;
              }
            }
          }
        }
        
        return {
          isValid: true,
          coordinates: { lat, lng },
          suggestion: suggestion
        };
      } else {
        return {
          isValid: false,
          error: 'הכתובת שהוזנה נמצאת מחוץ לישראל. אנא ודא שהכתובת נכונה.',
        };
      }
    }

    // If no results found, try without the city to suggest alternatives
    const addressOnlyParams = new URLSearchParams({
      format: 'json',
      q: `${address.trim()}, Israel`,
      limit: '3',
      addressdetails: '1',
      countrycodes: 'il',
      'accept-language': 'he,en'
    });

    const addressOnlyResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?${addressOnlyParams}`,
      {
        headers: {
          'User-Agent': 'MagenDvorimAdom/1.0 (bee-rescue@example.com)',
        },
      }
    );
    
    const addressOnlyData = await addressOnlyResponse.json();
    
    if (addressOnlyData && addressOnlyData.length > 0) {
      // Found the street in other cities, suggest alternatives
      const suggestions = addressOnlyData
        .filter(result => {
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          return lat >= 29.0 && lat <= 34.0 && lng >= 34.0 && lng <= 36.0;
        })
        .slice(0, 2)
        .map(result => {
          if (result.address && result.address.city) {
            return `${address.trim()}, ${result.address.city}`;
          }
          return null;
        })
        .filter(Boolean);
      
      if (suggestions.length > 0) {
        return {
          isValid: false,
          error: `לא מצאנו את הכתובת ב${city}. האם התכוונת לאחת מאלה?`,
          suggestion: suggestions.join(' או ')
        };
      }
    }

    // If no results found anywhere
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
