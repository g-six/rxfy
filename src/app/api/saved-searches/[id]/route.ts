import axios from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const gqlFindCustomer = `query FindCustomer($id: ID!) {
  customer(id: $id) {
    data {
      id
      attributes {
        email
        last_activity_at
      }
    }
  }
}`;

const gql_update_session = `mutation UpdateCustomerSession ($id: ID!, $last_activity_at: DateTime!) {
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

const gql_saved_search = `mutation CreateSavedSearch ($data: SavedSearchInput!) {
    createSavedSearch(data: $data) {
      data {
        id
        attributes {
          search_url
          last_email_at
          is_active
        }
      }
    }
  }`;

export async function POST(request: Request) {
  const authorization = await request.headers.get('authorization');
  const { search_url } = await request.json();
  const id = Number(request.url.split('/').pop());
  let session_key = '';

  if (!isNaN(id) && authorization) {
    const [prefix, value] = authorization.split(' ');
    if (prefix.toLowerCase() === 'bearer') {
      session_key = value;
      const { data: response_data } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gqlFindCustomer,
          variables: {
            id,
          },
        },
        {
          headers,
        },
      );

      if (response_data.data?.customer?.data?.attributes) {
        const { email, last_activity_at } = response_data.data?.customer?.data?.attributes;
        const encrypted_email = encrypt(email);
        const compare_key = `${encrypt(last_activity_at)}.${encrypted_email}`;
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
              query: gql_update_session,
              variables: {
                id,
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

          session_key = `${encrypt(dt)}.${encrypted_email}`;
          const { birthday: birthdate, ...attributes } = record.attributes;
          let birthday;
          if (birthdate) {
            birthday = new Intl.DateTimeFormat('en-CA').format(new Date(`${birthdate}T00:00:00`));
          }

          const { data: search_response } = await axios.post(
            `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
            {
              query: gql_saved_search,
              variables: {
                data: {
                  customer: id,
                  search_url,
                },
              },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
                'Content-Type': 'application/json',
              },
            },
          );
          let saved_search;
          if (search_response.data?.createSavedSearch?.data?.id) {
            const { id, attributes } = search_response.data?.createSavedSearch?.data;
            saved_search = {
              ...attributes,
              id,
            };
          }

          return new Response(
            JSON.stringify(
              {
                user: {
                  ...attributes,
                  birthday,
                  id,
                  email,
                },
                saved_search,
                session_key,
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
      statusText: 'Please login',
    },
  );
}