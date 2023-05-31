import axios from 'axios';

/**
 * Retrieves auto-complete
 * @returns property data
 */
export async function queryPlace(address: string, zip?: string) {
  let query = encodeURIComponent(address.split(' ').join('+'));
  if (zip) query = encodeURIComponent(zip.split(' ').join('+'));

  const response = await axios.get(`/api/places?query=${query}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}

export async function getPlaceDetails(place_id: string) {
  const response = await axios.get(`/api/places/${place_id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}
