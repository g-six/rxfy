import axios from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
import { extractBearerFromHeader } from '../request-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const gqlFindUser = `query FindCustomer($id: ID!) {
  user: customer(id: $id) {
    data {
      id
      attributes {
        email
        last_activity_at
      }
    }
  }
}`;

const gql = `mutation UpdateCustomerSession ($id: ID!, $last_activity_at: DateTime!) {
  session: updateCustomer(id: $id, data: { last_activity_at: $last_activity_at }) {
    record: data {
      id
      attributes {
        email
        full_name
        phone_number
        birthday
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
  let session_key = extractBearerFromHeader(request.headers.get('authorization') || '');
  if (session_key) {
    const { token, guid } = getTokenAndGuidFromSessionKey(session_key);

    if (token && guid) {
      const response_data = await getUserById(guid);
      if (response_data.data?.user?.data?.attributes) {
        const { email, last_activity_at } = response_data.data?.user?.data?.attributes;
        const encrypted_email = encrypt(email);
        const compare_key = `${encrypt(last_activity_at)}.${encrypted_email}-${guid}`;
        if (compare_key === session_key) {
          const dt = new Date().toISOString();
          const {
            data: {
              data: {
                session: { record },
              },
            },
          } = await axios.post(
            `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
            {
              query: gql,
              variables: {
                id: guid,
                last_activity_at: dt,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
                'Content-Type': 'application/json',
              },
            },
          );

          session_key = `${encrypt(dt)}.${encrypted_email}-${guid}`;
          return new Response(
            JSON.stringify(
              {
                ...record.attributes,
                id: guid,
                email,
                session_key,
                message: 'Logged in',
              },
              null,
              4,
            ),
            {
              headers: {
                'content-type': 'application/json',
              },
              status: 200,
            },
          );
        }
      }
    } else {
      return new Response(
        JSON.stringify(
          {
            error: 'Sorry, please login',
          },
          null,
          4,
        ),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 401,
          statusText: 'Sorry, please login',
        },
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
