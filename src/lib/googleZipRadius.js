// Utility to get zip codes within a radius using Google Maps APIs
// Requires GOOGLE_MAPS_API_KEY in env

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function geocodeZip(zip) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&components=country:US&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to geocode zip');
  const data = await res.json();
  const loc = data.results?.[0]?.geometry?.location;
  if (!loc) throw new Error('Could not geocode zip');
  return loc; // { lat, lng }
}

async function findNearbyZips(lat, lng, radiusMiles) {
  // Google Places API Nearby Search (type=postal_code) returns postal codes nearby
  // Note: radius is in meters
  const radiusMeters = radiusMiles * 1609.34;
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=postal_code&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch nearby postal codes');
  const data = await res.json();
  // Each result has a 'name' (the zip code)
  return (data.results || []).map(r => r.name).filter(Boolean);
}

/**
 * Returns zip codes within a radius of a home zip using Google Maps APIs
 * @param {string} homeZip
 * @param {number} radiusMiles
 * @returns {Promise<string[]>}
 */
export async function getZipCodesWithinRadiusGoogle(homeZip, radiusMiles) {
  if (!GOOGLE_MAPS_API_KEY) throw new Error('GOOGLE_MAPS_API_KEY not set');
  const { lat, lng } = await geocodeZip(homeZip);
  const zips = await findNearbyZips(lat, lng, radiusMiles);
  // Always include the home zip
  if (!zips.includes(homeZip)) zips.push(homeZip);
  return Array.from(new Set(zips));
}
