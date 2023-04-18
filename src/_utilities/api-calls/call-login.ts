import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Sign up a customer under the agent's account
 * @param email string
 * @param password string
 * @param opts { search_url?, is_agent? }
 * @returns
 */
export async function login(email: string, password: string, opts?: { search_url?: string; is_agent?: boolean }) {
  const response = await axios.post(
    opts?.is_agent ? '/api/agents/log-in' : '/api/log-in',
    {
      ...opts,
      email,
      password,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.data?.user?.id && response.data?.session_key) {
    Cookies.set('session_key', response.data.session_key);
  }

  return response.data || {};
}
