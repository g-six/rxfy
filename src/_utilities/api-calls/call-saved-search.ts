import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Save a customer map search
 * @param agent { id, logo? }
 * @param opts { search_url? }
 * @returns
 */
export async function saveSearch(agent: { id: number; logo?: string }, opts?: { search_url?: string }) {
  const response = await axios.post(
    `/api/saved-searches/${Cookies.get('guid')}`,
    {
      ...opts,
      agent: agent.id,
      logo: agent.logo,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 200) {
    const { session_key, ...record } = response.data;
    Cookies.set('session_key', session_key);
    return record;
  }

  return response;
}
