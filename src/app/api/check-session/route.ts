import axios from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../response-helper';
import { getNewSessionKey } from '../update-session';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const gqlFindUser = `query FindCustomer($id: ID!) {
  user: customer(id: $id) {
    data {
      id
      attributes {
        full_name
        email
        birthday
        phone_number
        last_activity_at
        yes_to_marketing
      }
    }
  }
}`;

export async function getUserById(id: number) {
  const { data } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gqlFindUser,
      variables: {
        id,
      },
    },
    {
      headers,
    },
  );

  return data;
}

export async function GET(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );

  const { email, full_name, last_activity_at, session_key } = await getNewSessionKey(token, guid);
  if (email && last_activity_at && session_key) {
    return getResponse(
      {
        id: guid,
        last_activity_at,
        email,
        full_name: full_name || '',
        session_key,
        message: 'Logged in',
      },
      200,
    );
  }
  return getResponse(
    {
      token,
      error: 'Unable to sign in. Session token is invalid.',
    },
    401,
  );
}
