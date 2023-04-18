import axios from 'axios';
import { randomString } from '../data-helpers/auth-helper';
import { capitalizeFirstLetter } from '../formatters';
import Cookies from 'js-cookie';
import { queryStringToObject } from '../url-helper';
import { SavedSearchInput } from '@/_typings/saved-search';

/**
 * Sign up a customer under the agent's account
 * @param agent { id, logo? }
 * @param customer { email, full_name?, password? }
 * @param opts { search_url? }
 * @returns
 */
export async function signUp(
  agent: { id: number; logo?: string; email?: string },
  customer: { email: string; full_name?: string; password?: string },
  opts?: { search_url?: string },
) {
  const password = customer.password || randomString(6);
  const full_name = customer.full_name || capitalizeFirstLetter(customer.email.split('@')[0].replace(/[^\w\s!?]/g, ''));

  let saved_search: SavedSearchInput = {};
  if (opts?.search_url) {
    saved_search = queryStringToObject(opts?.search_url) as unknown as SavedSearchInput;
  }

  const response = await axios.post(
    agent.email ? '/api/agents/sign-up' : '/api/sign-up',
    {
      ...opts,
      ...customer,
      agent: agent.id,
      logo: agent.logo,
      full_name,
      password,
      yes_to_marketing: true,
      saved_search,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.data?.customer?.id && response.data?.session_key) {
    Cookies.set('session_key', response.data.session_key);
  }

  return response.data || {};
}
