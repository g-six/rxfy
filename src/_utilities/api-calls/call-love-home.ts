import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { clearSessionCookies } from './call-logout';

/**
 * Retrieve customer saved homes
 * @returns
 */
export async function getLovedHomes() {
  try {
    const response = await axios.get('/api/loves', {
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
    } else if (response.status === 401) {
      clearSessionCookies();
    }

    return response;
  } catch (e) {
    const axerr = e as AxiosError;
    if (axerr.response?.status === 401) {
      clearSessionCookies();
    }
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
      `/api/loves`,
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

/**
 * Save a customer map search
 * @param number love.id
 * @returns
 */
export async function unloveHome(id: number) {
  try {
    const response = await axios.delete(`/api/loves/${id}`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    });

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
