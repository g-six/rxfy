import { LogInResponse } from '@/_typings/customer';
import { checkLogInResponse } from '@/_utilities/data-helpers/auth-helper';
import { encrypt } from '@/_utilities/encryption-helper';
import axios, { AxiosResponse } from 'axios';

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
        const { id, attributes } = data;
        const { email, full_name, agents } = attributes;
        return new Response(JSON.stringify({ customer: { id, email, full_name, agents } }, null, 4), {
          headers: {
            'content-type': 'application/json',
          },
          status: 200,
        });
      }

      return new Response(
        JSON.stringify(
          {
            error: 'Sorry, you may have inputted the wrong pair of credentials',
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
    },
  );
}
