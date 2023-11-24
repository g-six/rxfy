import axios from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
import { sendTemplate } from '../send-template';
import { GQ_FRAG_AGENT_CUSTOMER } from '../agents/graphql';
import { createSession, validateInput } from './subroutines';
import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (email && password) {
    const { data: valid_data, error: input_error } = validateInput({
      email,
      password,
    });

    if (input_error) return NextResponse.json({ error: input_error }, { status: 400 });

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
          return NextResponse.json(
            {
              error: `${days_since_last > 30 ? `It's been ${Math.floor(days_since_last)} days since you've logged in.` : ''} Please reactivate your account`,
            },
            {
              status: 401,
            },
          );
        }

        const session = await createSession(data.id);

        return NextResponse.json({
          session_key: session?.session_key,
          user: { id: Number(data.id), email, full_name, agents, ...session, session_key: undefined },
        });
      }

      const msg = 'Sorry, you may have inputted the wrong pair of credentials';

      return NextResponse.json(
        {
          error: msg,
        },
        {
          status: 400,
          statusText: msg,
        },
      );
    }
  }

  return NextResponse.json(
    {
      error: 'Please enter your email and password',
    },
    {
      status: 400,
      statusText: 'Please enter your email and password',
    },
  );
}
