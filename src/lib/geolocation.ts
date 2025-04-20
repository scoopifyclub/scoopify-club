/**
 * Utility functions for geolocation calculations
 */

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in miles between the two points
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Earth's radius in miles
  const R = 3958.8;
  
  // Convert latitude and longitude from degrees to radians
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Return distance rounded to 1 decimal place
  return Math.round(distance * 10) / 10;
}

/**
 * Get the current user location using browser geolocation API
 * @returns Promise that resolves to {latitude, longitude}
 */
export function getCurrentLocation(): Promise<{latitude: number; longitude: number}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

/**
 * Convert an address to coordinates using an external geocoding service
 * Note: In a production app, you would integrate with a geocoding service like Google Maps, Mapbox, etc.
 * @param address Address string
 * @returns Promise that resolves to {latitude, longitude}
 */
export async function geocodeAddress(address: string): Promise<{latitude: number; longitude: number}> {
  // This is a stub - in a real app you would use a geocoding service API
  // For example: 
  // const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.MAPBOX_TOKEN}`);
  // const data = await response.json();
  // return {
  //   latitude: data.features[0].center[1],
  //   longitude: data.features[0].center[0]
  // };
  
  throw new Error('Geocoding not implemented - requires external API integration');
} 