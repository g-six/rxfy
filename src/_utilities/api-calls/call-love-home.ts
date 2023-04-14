import axios from 'axios';
import Cookies from 'js-cookie';

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
      console.log(response.data);
      // const { session_key, ...record } = response.data;
      // Cookies.set('session_key', session_key);
      // return record;
    }
    return response;
  } catch (e) {
    console.log(e);
  }
}
