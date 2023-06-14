import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Retrieves all agent's clients
 * @returns customers data object array and session_key string
 */
export async function retrieveClients() {
  const response = await axios.get(`/api/customers`, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}-7083`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const { session_key, documents } = response.data;

    if (session_key) {
      Cookies.set('session_key', session_key);
    } else {
      console.log('Warning: no new session key has bee issued in retrieveClients()');
    }

    return documents;
  }

  return response;
}
