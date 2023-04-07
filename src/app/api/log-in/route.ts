import axios from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';

const gql = `query LogIn ($filters: CustomerFiltersInput!) {
  customers(filters: $filters) {
    data {
      id
      attributes {
        email
        full_name
        encrypted_password
        agents {
          data {
            id
            attributes {
              full_name
            }
          }
        }
      }
    }
  }
}`;

const session_gql = `mutation UpdateCustomerSession ($id: ID!, $logged_in_at: DateTime!) {
  session: updateCustomer(id: $id, data: { logged_in_at: $logged_in_at, last_activity_at: $logged_in_at }) {
    record: data {
      id
      attributes {
        email
        full_name
        logged_in_at
        last_activity_at
        agents {
          data {
            id
            attributes {
              full_name
            }
          }
        }
      }
    }
  }
}`;

function validateInput(data: { email?: string; password?: string; full_name?: string; agent_id?: number }): {
  data?: {
    email: string;
    password: string;
  };
  errors?: {
    email?: string;
    password?: string;
  };
  error?: string;
} {
  let error = '';

  if (!data.email) {
    error = `${error}\nA valid email is required`;
  }
  if (!data.password) {
    error = `${error}\nA hard-to-guess password with at least 10 characters is required`;
  }

  if (error) {
    return { error };
  }

  return {
    data: {
      ...data,
    } as unknown as {
      email: string;
      password: string;
    },
  };
}

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (email && password) {
    const { data: valid_data, error: input_error } = validateInput({
      email,
      password,
    });

    if (input_error) return { error: input_error };

    if (valid_data) {
      const { data: response_data } = await axios.post(
        `${process.env.NEXT_PUBLIC_CMS_GRAPHQL_URL}`,
        {
          query: gql,
          variables: {
            filters: {
              and: {
                email: {
                  eq: valid_data.email,
                },
                encrypted_password: {
                  eq: encrypt(valid_data.password),
                },
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const [data] = response_data.data?.customers?.data || [];

      if (data && Object.keys(data).length > 0) {
        const session = await createSession(data.id);

        const { attributes } = data;
        const { email, full_name, agents } = attributes;
        return new Response(
          JSON.stringify(
            {
              customer: { id: Number(data.id), email, full_name, agents, ...session },
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

      const msg = 'Sorry, you may have inputted the wrong pair of credentials';

      return new Response(
        JSON.stringify(
          {
            error: msg,
          },
          null,
          4,
        ),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 400,
          statusText: msg,
        },
      );
    }
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Please enter your email and password',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 400,
      statusText: 'Please enter your email and password',
    },
  );
}

async function createSession(id: number) {
  try {
    const {
      data: {
        data: {
          session: { record },
        },
      },
    } = await axios.post(
      `${process.env.NEXT_PUBLIC_CMS_GRAPHQL_URL}`,
      {
        query: session_gql,
        variables: {
          id,
          logged_in_at: new Date().toISOString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const { last_activity_at, email } = record.attributes;
    const prefix = encrypt(`${last_activity_at}`);
    const suffix = encrypt(email);
    const session_key = `${prefix}.${suffix}`;

    return {
      id,
      last_activity_at,
      email,
      session_key,
    };
  } catch (e) {
    console.log('Error in createSession subroutine');
    console.log(JSON.stringify(e, null, 4));
  }
}
