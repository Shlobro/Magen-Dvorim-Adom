import fetch from 'node-fetch';

/**
 * Geocode a textual address into latitude and longitude.
 * @param {string} address - The textual address to geocode.
 * @returns {Promise<{lat: number, lng: number} | null>} Coordinates or null if failed.
 */
export async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Magen-Dvorim-Adom/1.0 (admin@example.com)' // Use your project/contact info
    }
  });

  const data = await res.json();

  // ✅ Check if valid geocoding result exists
  if (!Array.isArray(data) || data.length === 0) {
    console.warn(`Geocoding failed for address: "${address}"`);
    return null;
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}
