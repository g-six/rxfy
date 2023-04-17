import axios from 'axios';
import Cookies from 'js-cookie';
import { CustomerInputModel } from '@/_typings/customer';

/**
 * Sign up a customer under the agent's account
 * @param agent { id, logo? }
 * @param customer { email, full_name?, password? }
 * @param opts { search_url? }
 * @returns
 */
export async function updateAccount(token: string, data: CustomerInputModel) {
  const [session_key, cid] = token.split('-');
  if (cid && session_key) {
    const response = await axios.put(
      '/api/update-account',
      {
        ...data,
        id: Number(cid),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session_key}`,
        },
      },
    );

    if (response.data?.customer?.id && response.data?.session_key) {
      Cookies.set('guid', response.data.customer.id);
      Cookies.set('session_key', response.data.session_key);
    }

    return response.data || {};
  }
}
