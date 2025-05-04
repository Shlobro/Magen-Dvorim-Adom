export async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'YourAppName/1.0 (email@example.com)' } });
    const data = await res.json();
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  