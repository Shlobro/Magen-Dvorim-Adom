// backend/services/geocodeAddress.js
import axios from 'axios';

/**
 * Strip common street-name prefixes so Nominatim matches Israeli addresses
 * that start with “רחוב …” / “רח' …” / “רח״ …”.
 */
const stripStreetPrefix = (str = '') =>
  str
    .trim()
    .replace(/^רח[ו"']?ב?\s+/i, '')   // removes רחוב / רח' / רח״ / רח
    .replace(/^street\s+/i, '')       // removes "street "
    .replace(/^ul\.\s+/i, '');        // removes "ul. " (Polish etc.)

export async function geocodeAddress(rawAddress) {
  if (!rawAddress) return null;

  // Normalise the query
  const address = stripStreetPrefix(rawAddress);

  try {
    const { data } = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 0,
          countrycodes: 'il',          // restrict to Israel
          'accept-language': 'he',     // prefer Hebrew results
        },
        headers: {
          // Nominatim usage policy: identify yourself with a valid e-mail / UA
          'User-Agent': 'magen-dvorim-adom/1.0 (mathscsandse@gmail.com)',
        },
      }
    );

    if (data.length) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    console.error(`Address not found: "${rawAddress}"`);
    return null;
  } catch (err) {
    console.error('Nominatim error:', err.message);
    return null;
  }
}
