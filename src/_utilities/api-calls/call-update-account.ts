import axios from 'axios';
import Cookies from 'js-cookie';
import { CustomerInputModel } from '@/_typings/customer';
import { getTokenAndGuidFromSessionKey } from './token-extractor';

/**
 * Sign up a customer under the agent's account
 * @param agent { id, logo? }
 * @param customer { email, full_name?, password? }
 * @param opts { search_url? }
 * @returns
 */
export async function updateAccount(session_key: string, data: CustomerInputModel) {
  const { token, guid } = getTokenAndGuidFromSessionKey(session_key);
  const id = Number(guid);
  if (!id && token) {
    const response = await axios.put(
      '/api/update-account',
      {
        ...data,
        id,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session_key}`,
        },
      },
    );

    if (response.data?.customer?.id && response.data?.session_key) {
      Cookies.set('session_key', response.data.session_key);
    }

    return response.data || {};
  }
}
