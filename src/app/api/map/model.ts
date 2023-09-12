import axios from 'axios';

export async function getMapboxApiData(lat: string | number, lng: string | number, q?: string) {
  const { NEXT_APP_MAPBOX_TOKEN } = process.env;
  const url = q
    ? `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
        q,
      )}&proximity=${lng},${lat}&access_token=${NEXT_APP_MAPBOX_TOKEN}&session_token=${new Date()
        .toISOString()
        .split('T')
        .reverse()
        .pop()}-searchbox-api-${lat}-${lng}`
    : `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address&access_token=${NEXT_APP_MAPBOX_TOKEN}`;
  console.log('\n\n\nMAPBOX API CALL', url);
  console.log('url', url);
  console.log('\nEND MAPBOX API CALL\n\n\n');
  return axios.get(url);
}

export async function getMapboxAddress(lat: string | number, lng: string | number, mapbox_id: string) {
  const { NEXT_APP_MAPBOX_TOKEN } = process.env;
  const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapbox_id}?session_token=${new Date()
    .toISOString()
    .split('T')
    .reverse()
    .pop()}-searchbox-api-${lat}-${lng}&access_token=${NEXT_APP_MAPBOX_TOKEN}`;
  return axios.get(url);
}
