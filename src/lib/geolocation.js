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
export function calculateDistance(lat1, lon1, lat2, lon2) {
    // Earth's radius in miles
    const R = 3958.8;
    // Convert latitude and longitude from degrees to radians
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    // Haversine formula
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
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
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                let errorMessage = 'Failed to get your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                }
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
};
/**
 * Convert an address to coordinates using a free geocoding service
 * @param address Address string
 * @returns Promise that resolves to {latitude, longitude}
 */
export async function geocodeAddress(address) {
    try {
        // Use OpenStreetMap Nominatim API (free, no API key required)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        
        if (!response.ok) {
            throw new Error('Geocoding service unavailable');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                displayName: data[0].display_name
            };
        } else {
            throw new Error('Address not found');
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        
        // Fallback: try to extract basic coordinates from common patterns
        const zipCodeMatch = address.match(/\b\d{5}\b/);
        if (zipCodeMatch) {
            // For Peyton, CO area, provide approximate coordinates
            if (zipCodeMatch[0] === '80831') {
                return {
                    latitude: 39.0328,
                    longitude: -104.4833,
                    displayName: 'Peyton, CO 80831 (approximate)'
                };
            }
        }
        
        throw new Error(`Geocoding failed: ${error.message}`);
    }
}
