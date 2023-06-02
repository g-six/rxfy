import axios from 'axios';

export async function getUserBySessionKey(session_key: string, user_type: 'realtor' | 'customer' = 'customer') {
  const api_response = await axios
    .get('/api/check-session' + (user_type === 'realtor' ? '/agent' : ''), {
      headers: {
        Authorization: `Bearer ${session_key}`,
      },
    })
    .catch(e => {
      console.log('User not logged in');
    });
  const session = api_response as unknown as {
    data?: {
      [key: string]: string | number;
    };
  };
  return session.data || { error: 'Invalid token provided' };
}
