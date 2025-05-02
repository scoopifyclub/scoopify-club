// Utility to get all zip codes within a radius of a given zip code
// Uses a static dataset of US zip codes with lat/lon
// For production, consider using a maintained package or API

import zipData from './us_zip_codes.json'; // { [zip]: { lat, lon } }

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns all zip codes within a radius (in miles) of the given zip code
 * @param {string} homeZip
 * @param {number} radiusMiles
 * @returns {string[]} Array of zip codes
 */
export function getZipCodesWithinRadius(homeZip, radiusMiles) {
  const home = zipData[homeZip];
  if (!home) return [];
  const zips = [];
  for (const [zip, { lat, lon }] of Object.entries(zipData)) {
    const dist = haversineDistance(home.lat, home.lon, lat, lon);
    if (dist <= radiusMiles) {
      zips.push(zip);
    }
  }
  return zips;
}
