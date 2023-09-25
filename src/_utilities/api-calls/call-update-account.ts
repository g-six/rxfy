import axios from 'axios';
import Cookies from 'js-cookie';
import { CustomerInputModel } from '@/_typings/customer';
import { RealtorInputModel } from '@/_typings/agent';

/**
 * Update realtor or customer's account.
 * @param agent { id, logo? }
 * @param user Customer or Realtor
 * @param realtor_mode defaults to false (customer mode)
 * @returns
 */
export async function updateAccount(session_key: string, data: CustomerInputModel | RealtorInputModel, realtor_mode = false) {
  const { phone, phone_number, ...updates } = data as unknown as {
    [key: string]: string;
  };
  const response = await axios.put(`/api${realtor_mode ? '/agents' : ''}/update-account`, data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session_key}`,
    },
  });

  if (response.data?.session_key) {
    Cookies.set('session_key', response.data.session_key);
  }

  return response.data || {};
}
