import axios from 'axios';
import Cookies from 'js-cookie';
import { CustomerInputModel } from '@/_typings/customer';
import { RealtorInputModel } from '@/_typings/agent';

/**
 * Sign up a customer under the agent's account
 * @param agent { id, logo? }
 * @param customer { email, full_name?, password? }
 * @param opts { search_url? }
 * @returns
 */
export async function updateAccount(session_key: string, data: CustomerInputModel | RealtorInputModel, realtor_mode = false) {
  const response = await axios.put(
    `/api${realtor_mode ? '/agents' : ''}/update-account`,
    {
      ...data,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session_key}`,
      },
    },
  );

  if (response.data?.user?.id && response.data?.session_key) {
    Cookies.set('session_key', response.data.session_key);
  }

  return response.data || {};
}
