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

  const response_data = await getUserById(guid);
  if (response_data.data?.user?.data?.attributes) {
    const { email, last_activity_at } = response_data.data?.user?.data?.attributes;
    const encrypted_email = encrypt(email);
    const compare_key = `${encrypt(last_activity_at)}.${encrypted_email}`;
    if (compare_key === token) {
      const { session_key } = await getNewSessionKey(token, guid);
      return getResponse(
        {
          ...response_data.data.user.data.attributes,
          id: guid,
          email,
          session_key,
          message: 'Logged in',
        },
        200,
      );
    }
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Please login',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 401,
    },
  );
}
