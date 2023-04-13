import { convertDateStringToDateObject } from '@/_utilities/data-helpers/date-helper';
import { encrypt } from '@/_utilities/encryption-helper';
import axios from 'axios';

const gql = `query GetUserId ($id: ID!) {
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

const mutation_gql = `mutation UpdateAccount ($id: ID!, $data: CustomerInput!) {
    customer: updateCustomer(id: $id, data: $data) {
      record: data {
        id
        attributes {
          email
          full_name
          birthday
          phone_number
          last_activity_at
          yes_to_marketing
        }
      }
    }
}`;

export async function PUT(request: Request) {
  const { id, email, full_name, phone_number, birthday, password } = await request.json();

  try {
    let updates: { [key: string]: Date | string | number | boolean } = {
      last_activity_at: new Date().toISOString(),
    };

    if (request.headers.get('authorization')) {
      const [token_type, token] = `${request.headers.get('authorization')}`.split(' ');

      if (token_type.toLowerCase() === 'bearer' && token) {
        const { data: response_data } = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: gql,
            variables: {
              id,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
              'Content-Type': 'application/json',
            },
          },
        );
        const record = response_data.data?.customer?.data?.attributes || {};
        if (!record.email || !record.last_activity_at || `${encrypt(record.last_activity_at)}.${encrypt(record.email)}` !== token) {
          return new Response(
            JSON.stringify(
              {
                error: 'Invalid token or you have been signed out, please login again',
              },
              null,
              4,
            ),
            {
              headers: {
                'content-type': 'application/json',
              },
              status: 400,
            },
          );
        } else if (email !== undefined && record.email !== email) {
          updates = {
            ...updates,
            email,
          };
        }
      }
    } else {
      return new Response(
        JSON.stringify(
          {
            error: 'Bearer token is required',
          },
          null,
          4,
        ),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 400,
        },
      );
    }

    if (full_name) {
      updates = {
        ...updates,
        full_name,
      };
    }
    if (phone_number) {
      updates = {
        ...updates,
        phone_number,
      };
    }
    if (birthday) {
      updates = {
        ...updates,
        birthday: convertDateStringToDateObject(birthday).toISOString().split('T')[0],
      };
    }

    if (password) {
      updates = {
        ...updates,
        encrypted_password: encrypt(password),
      };
    }

    const variables = {
      id,
      data: updates,
    };

    console.log(JSON.stringify({ variables }, null, 4));
    const {
      data: {
        data: { customer },
      },
    } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: mutation_gql,
        variables,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return new Response(
      JSON.stringify(
        {
          user: {
            id,
            ...customer.record.attributes,
          },
          session_key: `${encrypt(customer.record.attributes.last_activity_at as string)}.${encrypt(customer.record.attributes.email)}`,
        },
        null,
        4,
      ),
      {
        headers: {
          'content-type': 'application/json',
        },
      },
    );
  } catch (e) {
    console.log('Error in Update Account API request');
    console.log(JSON.stringify(e, null, 4));
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Unable to update your account',
        id,
        email,
        full_name,
        phone_number,
        birthday,
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 400,
    },
  );
}
