import axios from 'axios';
import Cookies from 'js-cookie';

export async function getUserBySessionKey(session_key: string, user_type: 'realtor' | 'customer' = 'customer') {
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
  }
  return session?.data || { error: 'Invalid token provided' };
}

export async function emailPasswordReset(email: string, user_type: string, pathway: string) {
  const api_response = await axios.put(
    `/api/reset-password${user_type === 'realtor' ? '/realtor' : ''}`,
    { email, pathway },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return api_response.data;
}
