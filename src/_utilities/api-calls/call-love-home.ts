import axios, { AxiosError } from 'axios';
import { cache } from 'react';
import Cookies from 'js-cookie';
import { clearSessionCookies } from './call-logout';
import { getData, setData } from '../data-helpers/local-storage-helper';
import { Events } from '@/_typings/events';
const FILE = 'call-love-home.ts';
/**
 * Retrieve customer saved homes
 * @returns
 */
export const getLovedHomes = cache(async (relationship_id?: number) => {
  if (!Cookies.get('session_key')) return;
  try {
    const response = await axios.get(relationship_id ? `/api/agents/customer/${relationship_id}/loves` : '/api/loves', {
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
});

/**
 * Save a customer map search
 * @param string mls_id
 * @param number agent.id
 * @param boolean if true, API will remove existing mls_id from loved homes OR add them if they aren't previously loved
 * @returns
 */
export async function loveHome(mls_id: string, agent: number, customer?: number) {
  try {
    // Handle localStorage
    const local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
    let toggle = { loved: false };
    if (!local_loves.includes(mls_id)) {
      local_loves.push(mls_id);
      setData(Events.LovedItem, JSON.stringify(local_loves));
      toggle.loved = true;
    }
    if (!Cookies.get('session_key') || (Cookies.get('session_as') === 'realtor' && !customer)) return toggle;

    const response = await axios.post(
      '/api/loves',
      {
        mls_id,
        agent,
        customer,
      },
      {
        headers: {
          Authorization: `Bearer ${Cookies.get('session_key')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data?.session_key) {
      Cookies.set('session_key', response.data.session_key);
    }
    if (response.status === 200) {
      const { session_key, ...record } = response.data;
      return record;
    }
    return response;
  } catch (e) {
    console.log(FILE, e);
  }
}

/**
 * Save a customer map search
 * @param number love.id
 * @returns
 */
export async function unloveByMLSId(mls_id: string) {
  try {
    // Handle localStorage
    const local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
    setData(Events.LovedItem, JSON.stringify(local_loves.filter(loved => loved !== mls_id)));
    if (!Cookies.get('session_key')) return { loved: false };

    const response = await axios.delete(`/api/loves?mls_id=${mls_id}`, {
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

/**
 * Save a customer map search
 * @param number love.id
 * @returns
 */
export async function unloveHomeForCustomer(id: number, customer_id: number) {
  try {
    const response = await axios.delete(`/api/agents/customer/${customer_id}/loves/${id}`, {
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

/**
 * Update / add a note
 * @param number love.id
 * @returns
 */
export async function addOrUpdateNotes(id: number, notes: string) {
  try {
    const response = await axios.put(
      `/api/loves/${id}`,
      {
        notes,
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
 * Highlight a loved home (for client dashboard flow)
 * @param number love.id
 * @returns
 */
export async function highlightHome(id: number, is_highlighted = true) {
  try {
    const response = await axios.put(
      `/api/loves/${id}`,
      {
        is_highlighted,
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
