import axios from 'axios';
import Cookies from 'js-cookie';
import { clearSessionCookies } from './call-logout';

export async function getUserBySessionKey(session_key: string, user_type: 'realtor' | 'customer' = 'customer') {
  console.log('getUserBySessionKey');
  const api_response = await axios.get('/api/check-session' + (user_type === 'realtor' ? '/agent' : ''), {
    headers: {
      Authorization: `Bearer ${session_key}`,
    },
  });
  const session = api_response as unknown as {
    data?: {
      [key: string]: string | number;
    };
  };
  if (session.data?.session_key) {
    Cookies.set('session_key', session.data.session_key as string);
    Cookies.set('session_as', user_type);
  }
  return session?.data || { error: 'Invalid token provided' };
}
