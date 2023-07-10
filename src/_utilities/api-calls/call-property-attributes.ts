import axios from 'axios';

/**
 * Retrieves a list of possible property attributes
 * @returns property data
 */
export async function getPropertyAttributes() {
  const response = await axios.get('/api/property-attributes', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}

/**
 * Retrieves a list of possible property attributes
 * @returns property data
 */
export async function getDwellingTypes() {
  const response = await axios.get('/api/dwelling-types', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}
