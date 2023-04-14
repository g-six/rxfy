import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Retrieve customer saved homes
 * @returns
 */
export async function getLovedHomes() {
  try {
    const response = await axios.get(`/api/loves/${Cookies.get('cid')}`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const { session_key, ...records } = response.data;
      if (session_key) {
        Cookies.set('session_key', session_key);
      }
      return records;
    }

    return response;
  } catch (e) {
    console.log(e);
  }
}

/**
 * Save a customer map search
 * @param string mls_id
 * @param number agent.id
 * @returns
 */
export async function loveHome(mls_id: string, agent: number) {
  try {
    const response = await axios.post(
      `/api/loves/${Cookies.get('cid')}`,
      {
        mls_id,
        agent,
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
  } catch (e) {
    console.log(e);
  }
}
