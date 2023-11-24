import axios from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
import { GQ_FRAG_AGENT_CUSTOMER } from '../agents/graphql';

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

export async function createSession(id: number) {
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

export function validateInput(data: { email?: string; password?: string; full_name?: string; agent_id?: number }): {
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
