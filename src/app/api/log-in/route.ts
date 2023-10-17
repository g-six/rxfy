import axios from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
import { getResponse } from '../response-helper';
import { sendTemplate } from '../send-template';
import { GQ_FRAG_AGENT_CUSTOMER } from '../agents/graphql';

const gql = `query LogIn ($filters: CustomerFiltersInput!) {
  users: customers(filters: $filters) {
    data {
      id
      attributes {
        email
        full_name
        encrypted_password
        last_activity_at
        agents_customers {
          ${GQ_FRAG_AGENT_CUSTOMER}
        }
      }
    }
  }
}`;

const session_gql = `mutation UpdateCustomerSession ($id: ID!, $logged_in_at: DateTime!) {
  session: updateCustomer(id: $id, data: { logged_in_at: $logged_in_at, last_activity_at: $logged_in_at, active_account: true }) {
    record: data {
      id
      attributes {
        email
        full_name
        logged_in_at
        last_activity_at
        agents_customers {
          ${GQ_FRAG_AGENT_CUSTOMER}
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
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
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
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const [data] = response_data.data?.users?.data || [];

      if (data && Object.keys(data).length > 0) {
        const { attributes } = data;
        const { email, full_name, agents, last_activity_at } = attributes;
        let last_activity_date = new Date();
        let days_since_last = -1;
        if (last_activity_at) {
          last_activity_date = new Date(last_activity_at);
          days_since_last = (Date.now() - last_activity_date.getTime()) / 1000 / 60 / 60 / 24;
        }

        if (days_since_last === -1 || days_since_last > 30) {
          const url = new URL(request.url);
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
            },
          ).catch(console.log);
          return getResponse(
            {
              error: `${days_since_last > 30 ? `It's been ${Math.floor(days_since_last)} days since you've logged in.` : ''} Please reactivate your account`,
            },
            401,
          );
        }

        const session = await createSession(data.id);

        return new Response(
          JSON.stringify(
            {
              session_key: session?.session_key,
              user: { id: Number(data.id), email, full_name, agents, ...session, session_key: undefined },
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
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: session_gql,
        variables: {
          id,
          logged_in_at: new Date().toISOString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const { last_activity_at, email } = record.attributes;
    const prefix = encrypt(`${last_activity_at}`);
    const suffix = encrypt(email);
    const session_key = `${prefix}.${suffix}-${id}`;

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
