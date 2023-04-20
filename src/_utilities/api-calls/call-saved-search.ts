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
    '/api/saved-searches',
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

export async function getSearches() {
  if (Cookies.get('session_key')) {
    const xhr = await axios.get('/api/saved-searches', {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
      },
    });

    if (xhr?.data?.session_key) Cookies.set('session_key', xhr.data.session_key);
    return xhr?.data?.records || [];
  }
  return;
}
