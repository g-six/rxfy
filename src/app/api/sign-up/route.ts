import axios, { AxiosError } from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
import { sendTemplate } from '../send-template';
import { SavedSearch } from '@/_typings/saved-search';
import { getResponse } from '../response-helper';
import { validateInput } from './subroutines';
import { NextRequest, NextResponse } from 'next/server';

const gql = `mutation SignUp ($data: CustomerInput!) {
  createCustomer(data: $data) {
    data {
      id
      attributes {
        email
        full_name
        last_activity_at
      }
    }
  }
}`;
const gql_crm = `mutation PostSignUp ($data: AgentsCustomerInput!) {
  createAgentsCustomer(data: $data) {
    data {
      id
      attributes {
        status
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

export async function POST(request: NextRequest) {
  const { email, full_name, password, agent, logo, yes_to_marketing, saved_search, dashboard_uri } = await request.json();
  let created_saved_search: SavedSearch | undefined = undefined;
  if (!yes_to_marketing) {
    return NextResponse.json(
      {
        error: 'Please accept our marketing emails to sign up for free',
      },

      {
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

      if (input_error) return NextResponse.json({ error: input_error }, { status: 400 });

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

        const crm = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: gql_crm,
            variables: {
              data: {
                agent: Number(agent),
                customer: Number(data.id),
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

        if (crm.data.errors) {
          return NextResponse.json(
            {
              error: 'Unable to sign up.  CRM error.',
            },
            {
              status: 400,
            },
          );
        }

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

          // search_url,

          await sendTemplate(
            'welcome-buyer',
            [
              {
                name: full_name,
                email,
              },
            ],
            {
              url: `${url.origin}${dashboard_uri || '/my-profile'}?key=${encrypt(last_activity_at)}.${encrypt(email)}-${data.id}`,
              agent_logo: logo,
              password: valid_data.password,
            },
          ).catch(console.log);
          return NextResponse.json({
            customer: { id: Number(data.id), email, full_name, agents },
            session_key: `${encrypt(last_activity_at)}.${encrypt(email)}-${data.id}`,
            saved_search: created_saved_search,
          });
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

        return NextResponse.json(
          {
            error: api_error,
          },
          {
            status: 400,
          },
        );
      }
    }
  } catch (e) {
    const error = e as AxiosError;
    console.log('Error in Signup API', error.response?.data);
    if (error.response?.data)
      return NextResponse.json(error.response?.data, {
        status: 400,
      });
  }

  return NextResponse.json(
    {
      error: 'Please enter your email and password',
    },
    {
      status: 400,
    },
  );
}
