
const axios = require('axios');

const apiKey = 'AIzaSyALvbBxcZQpHExPUiL4uUvfU4JfbxqjANI';
const url = 'https://places.googleapis.com/v1/places:searchNearby';

const body = {
  includedPrimaryTypes: ['restaurant'],
  maxResultCount: 20,
  locationRestriction: {
    circle: {
      center: { latitude: 32.0853, longitude: 34.7818 },
      radius: 15000,
    },
  },
};

axios.post(url, body, {
  headers: {
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.rating',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Data:', JSON.stringify(r.data, null, 2).substring(0, 500));
})
.catch(err => {
  console.error('Error status:', err.response?.status);
  console.error('Error data:', JSON.stringify(err.response?.data, null, 2));
  console.error('Error message:', err.message);
});
