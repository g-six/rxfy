import axios, { AxiosError } from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
import { sendTemplate } from '../send-template';
import { SavedSearch } from '@/_typings/saved-search';
import { getResponse } from '../response-helper';

type SignUpModel = {
  email: string;
  full_name: string;
  password: string;
  agent: number;
};

const gql = `mutation SignUp ($data: CustomerInput!) {
  createCustomer(data: $data) {
    data {
      id
      attributes {
        email
        full_name
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

const gql_saved_search = `mutation CreateSavedSearch ($data: SavedSearchInput!) {
  createSavedSearch(data: $data) {
    data {
      id
      attributes {
        last_email_at
        is_active
        lat
        lng
        nelat
        nelng
        swlat
        swlng
        zoom
        maxprice
        minprice
        beds
        baths
        type
      }
    }
  }
}`;

function validateInput(data: { email?: string; password?: string; full_name?: string; agent?: number }): {
  data?: SignUpModel;
  errors?: {
    email?: string;
    full_name?: string;
    password?: string;
  };
  error?: string;
} {
  let error = '';

  if (!data.email) {
    error = `${error}\nA valid email is required`;
  }
  if (!data.full_name) {
    error = `${error}\nA name to address`;
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
    } as unknown as SignUpModel,
  };
}

async function createLegacyRecords(record: {
  email: string;
  password: string;
  agent_id: number;
  full_name?: string;
  phone_number?: string;
  search_url?: string;
}): Promise<{
  error?: string;
  jwt?: string;
  client?: {
    [key: string]:
      | string
      | number
      | Date
      | {
          [key: string]: string;
        };
  };
  saved_search?: {
    [key: string]:
      | string
      | number
      | Date
      | {
          [key: string]: string;
        };
  };
  user?: {
    [key: string]:
      | string
      | number
      | Date
      | {
          [key: string]: string;
        };
  };
}> {
  // First, create auth user record
  const new_user_res = await fetch(`${process.env.NEXT_APP_STRAPI_URL}/auth/local/register`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      email: record.email,
      username: record.email,
      name: record.full_name,
      password: record.password,
      user_type: 'user',
    }),
  });

  if (new_user_res.status >= 400) {
    return {
      error: `Unable to create legacy user record:\n\n${new_user_res.statusText}`,
    };
  } else {
    const { jwt, user } = await (<Promise<{ jwt: string; user: { id: number } }>>new_user_res.json());

    if (user && user.id) {
      // Next, create client record
      const names = (record.full_name || '').split(' ');

      const client_input = {
        last_name: names.pop(),
        first_name: names.join(' '),
        email: record.email,
        active: true,
        client_user: user.id,
      };

      const client_xhr = await fetch(`${process.env.NEXT_APP_STRAPI_URL}/clients`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(client_input),
      });

      const client = await (<Promise<{ id: number }>>client_xhr.json());

      return {
        client,
        user,
      };
    } else {
      return {
        jwt,
        user,
        error: 'Legacy API request went OK but there are no JWT or user record returned',
      };
    }
  }
}

export async function POST(request: Request) {
  const { email, full_name, password, agent, logo, yes_to_marketing, saved_search, search_url } = await request.json();
  let created_saved_search: SavedSearch | undefined = undefined;
  if (!yes_to_marketing) {
    return new Response(
      JSON.stringify(
        {
          error: 'Please accept our marketing emails to sign up for free',
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
  try {
    if (email && password && full_name && yes_to_marketing) {
      const { data: valid_data, error: input_error } = validateInput({
        email,
        full_name,
        password,
        agent,
      });

      if (input_error) return { error: input_error };
      console.log({ valid_data });
      if (valid_data) {
        const encrypted_password = encrypt(valid_data.password);
        const response = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: gql,
            variables: {
              data: {
                email: valid_data.email,
                encrypted_password,
                full_name: valid_data.full_name,
                last_activity_at: new Date().toISOString(),
                agents: [Number(agent)],
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

        const { data: response_data } = response;
        if (response_data.errors) {
          return getResponse(
            {
              error: 'Unable to sign up.  E-mail might have already been used in signing up.',
            },
            400,
          );
        }

        const data = response_data.data?.createCustomer?.data || {};
        const errors: {
          message?: string;
          extensions?: {
            error?: {
              message?: string;
              details?: {
                errors: {
                  path: string[];
                  message: string;
                }[];
              };
            };
          };
        }[] = response_data.errors || [];

        let api_error = '';
        if (data && Object.keys(data).length > 0) {
          const { attributes } = data;
          const { email, full_name, agents, last_activity_at } = attributes;
          const url = new URL(request.url);

          // request.url
          if (saved_search) {
            const { data: search_response } = await axios.post(
              `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
              {
                query: gql_saved_search,
                variables: {
                  data: {
                    ...saved_search,
                    zoom: saved_search.zoom ? Math.ceil(saved_search.zoom) : 9,
                    customer: data.id,
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
            if (search_response.data?.createSavedSearch?.data?.id) {
              const { id, attributes } = search_response.data?.createSavedSearch?.data;
              created_saved_search = {
                ...attributes,
                id,
              };
            }
          }

          const { error: legacy_error } = await createLegacyRecords({
            ...valid_data,
            agent_id: Number(agent),
            search_url,
          });

          if (legacy_error) {
            console.log({ legacy_error });
            return getResponse({
              message: 'Unable to sign user up based on Strapi a v3 thrown error',
            });
          }

          await sendTemplate(
            'welcome-buyer',
            [
              {
                name: full_name,
                email,
              },
            ],
            {
              url: `${url.origin}/my-profile?key=${encrypt(last_activity_at)}.${encrypt(email)}-${data.id}`,
              agent_logo: logo,
            },
          ).catch(console.log);

          return new Response(
            JSON.stringify(
              {
                customer: { id: Number(data.id), email, full_name, agents },
                session_key: `${encrypt(last_activity_at)}.${encrypt(email)}`,
                saved_search: created_saved_search,
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
        } else if (errors && Object.keys(errors).length > 0) {
          errors.forEach(({ message, extensions }) => {
            if (extensions) {
              if (extensions.error?.details?.errors) {
                extensions.error?.details?.errors.forEach(({ path, message }) => {
                  if (path.includes('email')) {
                    api_error = `${api_error}Email is either invalid or already taken\n`;
                  } else {
                    api_error = `${api_error}${message}\n`;
                  }
                });
              } else if (extensions.error?.message) {
                api_error = `${extensions.error.message}\n`;
              } else if (message) {
                api_error = `${message}\n`;
              }
            }
          });
        }

        return new Response(
          JSON.stringify(
            {
              error: api_error,
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
    }
  } catch (e) {
    const error = e as AxiosError;
    console.log('Error in Signup API', error.response?.data);
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
    },
  );
}
