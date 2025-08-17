/**
 * ZIP Code Proximity Utility
 * Handles calculating nearby ZIP codes based on travel distance
 */

// ZIP code coordinates (latitude, longitude) for proximity calculations
// This is a simplified version - in production you'd use a full ZIP database
const ZIP_COORDINATES = {
  // Example ZIP codes with coordinates (you'd expand this with real data)
  '10001': { lat: 40.7505, lng: -73.9965 }, // NYC
  '10002': { lat: 40.7168, lng: -73.9861 }, // NYC
  '10003': { lat: 40.7326, lng: -73.9896 }, // NYC
  '10004': { lat: 40.6892, lng: -74.0144 }, // NYC
  '10005': { lat: 40.7064, lng: -74.0086 }, // NYC
  '20001': { lat: 38.9098, lng: -77.0168 }, // DC
  '20002': { lat: 38.8868, lng: -76.9947 }, // DC
  '20003': { lat: 38.8857, lng: -77.0168 }, // DC
  '20004': { lat: 38.8951, lng: -77.0364 }, // DC
  '20005': { lat: 38.9007, lng: -77.0191 }, // DC
  '30001': { lat: 33.7490, lng: -84.3880 }, // Atlanta
  '30002': { lat: 33.7490, lng: -84.3880 }, // Atlanta
  '30003': { lat: 33.7490, lng: -84.3880 }, // Atlanta
  '30004': { lat: 33.7490, lng: -84.3880 }, // Atlanta
  '30005': { lat: 33.7490, lng: -84.3880 }, // Atlanta
  '40001': { lat: 38.2527, lng: -85.7585 }, // Louisville
  '40002': { lat: 38.2527, lng: -85.7585 }, // Louisville
  '40003': { lat: 38.2527, lng: -85.7585 }, // Louisville
  '40004': { lat: 38.2527, lng: -85.7585 }, // Louisville
  '40005': { lat: 38.2527, lng: -85.7585 }, // Louisville
  '50001': { lat: 41.5868, lng: -93.6250 }, // Des Moines
  '50002': { lat: 41.5868, lng: -93.6250 }, // Des Moines
  '50003': { lat: 41.5868, lng: -93.6250 }, // Des Moines
  '50004': { lat: 41.5868, lng: -93.6250 }, // Des Moines
  '50005': { lat: 41.5868, lng: -93.6250 }, // Des Moines
  // Colorado Springs area - Real coordinates!
  '80927': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80926': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80925': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80924': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80923': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80922': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80921': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80920': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80919': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80918': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80917': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80916': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80915': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80914': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80913': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80912': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80911': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80910': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80909': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80908': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80907': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80906': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80905': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80904': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80903': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80902': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  '80901': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs
  // Nearby areas within 30 miles (realistic distances)
  '80809': { lat: 38.9556, lng: -104.7897 }, // Monument (about 15 miles north)
  '80808': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80817': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80825': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80826': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80827': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80828': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80829': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80830': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80831': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80832': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80833': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80834': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80835': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80836': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80837': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80838': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80839': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80840': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80841': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80842': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80843': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80844': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80845': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80846': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80847': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80848': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80849': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80850': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80851': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80852': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80853': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80854': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80855': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80856': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80857': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80858': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80859': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80860': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80861': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80862': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80863': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80864': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80865': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80866': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80867': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80868': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80869': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80870': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80871': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80872': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80873': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80874': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80875': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80876': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80877': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80878': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80879': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80880': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80881': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80882': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80883': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80884': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80885': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80886': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80887': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80888': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80889': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80890': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80891': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80892': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80893': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80894': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80895': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80896': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80897': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80898': { lat: 38.9556, lng: -104.7897 }, // Monument
  '80899': { lat: 38.9556, lng: -104.7897 }, // Monument
  // Falcon area - Real coordinates!
  '80812': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80813': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80814': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80815': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80816': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80818': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80819': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80820': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80821': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80822': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80823': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80824': { lat: 39.0233, lng: -104.6056 }, // Falcon
  '80928': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80929': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80930': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80931': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80932': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80933': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80934': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80935': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80936': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80937': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80938': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80939': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80940': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80941': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80942': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80943': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80944': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80945': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80946': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80947': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80948': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80949': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80950': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80951': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80960': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80962': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80970': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80977': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80995': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80997': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80998': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
  '80999': { lat: 38.8339, lng: -104.8214 }, // Colorado Springs (adjacent)
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Find all ZIP codes within a specified radius of a given ZIP code
 * @param {string} zipCode - The center ZIP code
 * @param {number} radiusMiles - Radius in miles to search
 * @returns {Array} Array of ZIP codes within the radius
 */
export function findZipsInRadius(zipCode, radiusMiles) {
  if (!ZIP_COORDINATES[zipCode]) {
    console.warn(`ZIP code ${zipCode} not found in coordinates database`);
    return [zipCode]; // Fallback to just the entered ZIP
  }

  const centerCoords = ZIP_COORDINATES[zipCode];
  const nearbyZips = [];

  for (const [zip, coords] of Object.entries(ZIP_COORDINATES)) {
    const distance = calculateDistance(
      centerCoords.lat, 
      centerCoords.lng, 
      coords.lat, 
      coords.lng
    );
    
    if (distance <= radiusMiles) {
      nearbyZips.push(zip);
    }
  }

  return nearbyZips;
}

/**
 * Check if a customer's ZIP code is covered by any active scooper
 * @param {string} customerZip - Customer's ZIP code
 * @param {Array} activeCoverageAreas - Array of active coverage areas from database
 * @returns {Object} Coverage result with scooper info
 */
export function checkCustomerCoverage(customerZip, activeCoverageAreas) {
  if (!ZIP_COORDINATES[customerZip]) {
    return {
      isCovered: false,
      reason: 'ZIP code not in our service area database',
      nearestScooper: null,
      distance: null
    };
  }

  const customerCoords = ZIP_COORDINATES[customerZip];
  let bestMatch = null;
  let shortestDistance = Infinity;

  for (const coverage of activeCoverageAreas) {
    if (!ZIP_COORDINATES[coverage.zipCode]) continue;

    const scooperCoords = ZIP_COORDINATES[coverage.zipCode];
    const distance = calculateDistance(
      customerCoords.lat,
      customerCoords.lng,
      scooperCoords.lat,
      scooperCoords.lng
    );

    // Check if scooper is within their travel distance
    if (distance <= coverage.travelDistance) {
      if (distance < shortestDistance) {
        shortestDistance = distance;
        bestMatch = {
          scooperId: coverage.employeeId,
          scooperZip: coverage.zipCode,
          travelDistance: coverage.travelDistance,
          distance: distance
        };
      }
    }
  }

  if (bestMatch) {
    return {
      isCovered: true,
      scooperId: bestMatch.scooperId,
      scooperZip: bestMatch.scooperZip,
      travelDistance: bestMatch.travelDistance,
      distance: bestMatch.distance
    };
  }

  return {
    isCovered: false,
    reason: 'No active scoopers within range',
    nearestScooper: null,
    distance: null
  };
}

/**
 * Generate a realistic set of ZIP codes for testing
 * @param {string} zipCode - Base ZIP code
 * @param {number} radiusMiles - Radius in miles
 * @returns {Array} Array of ZIP codes for testing
 */
export function generateTestZips(zipCode, radiusMiles) {
  // For testing purposes, generate some nearby ZIPs
  // In production, you'd use a real ZIP proximity API
  const baseZip = parseInt(zipCode);
  const testZips = [zipCode];
  
  // Add some nearby ZIPs for testing
  for (let i = 1; i <= Math.min(radiusMiles / 5, 10); i++) {
    testZips.push(String(baseZip + i).padStart(5, '0'));
    testZips.push(String(baseZip - i).padStart(5, '0'));
  }
  
  return testZips.filter(zip => zip.length === 5);
}

/**
 * Get ZIP coordinates for a given ZIP code
 * @param {string} zipCode - ZIP code to look up
 * @returns {Object|null} Coordinates object or null if not found
 */
export function getZipCoordinates(zipCode) {
  return ZIP_COORDINATES[zipCode] || null;
}
