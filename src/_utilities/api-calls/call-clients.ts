import { CustomerInputModel } from '@/_typings/customer';
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

/**
 * Create a client for a realtor
 * @returns customers data object array and session_key string
 */
export async function createClient(client: CustomerInputModel, host?: string) {
  const response = await axios.post(
    `/api/agents/customer`,
    {
      ...client,
      host,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 200) {
    const { session_key, ...customer } = response.data;

    if (session_key) {
      Cookies.set('session_key', session_key);
    } else {
      console.log('Warning: no new session key has bee issued in retrieveClients()');
    }

    return customer;
  }

  return response;
}

export async function moveClient(id: number, status: 'active' | 'lead' | 'closed') {
  const response = await axios.put(
    `/api/agents/customer/${id}`,
    {
      status,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 200) {
    const customer = response.data;

    if (customer.session_key) {
      Cookies.set('session_key', customer.session_key);
    } else {
      console.log('Warning: no new session key has bee issued in moveClient()');
    }

    return customer;
  }

  return response;
}

export async function updateClient(id: number, updates: { [key: string]: number | string }) {
  const { birthday: ymd_birthday, ...o } = updates;
  let birthday;
  if (ymd_birthday) {
    const [year, month, day] = `${ymd_birthday}`.split('-').map(Number);
    birthday = new Date(year, month - 1, day).toISOString().substring(0, 10);
  }

  const response = await axios.put(
    `/api/agents/customer/${id}/account`,
    {
      ...o,
      birthday,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data;
}
