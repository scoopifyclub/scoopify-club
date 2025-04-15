require('dotenv').config();
const https = require('https');

async function testGoogleMapsAPI() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const address = 'New York, NY';
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'OK') {
            console.log('✅ Google Maps API test successful');
            console.log('Location found:', result.results[0].formatted_address);
            console.log('Coordinates:', result.results[0].geometry.location);
            resolve(true);
          } else {
            console.error('❌ Google Maps API test failed');
            console.error('Error:', result.status);
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });
  });
}

// Run the test
testGoogleMapsAPI(); 