import { encrypt } from '@/_utilities/encryption-helper';
import axios from 'axios';
function getUpdateSessionGql(user_type: 'Agent' | 'Customer') {
  return `mutation UpdateSession ($id: ID!, $last_activity_at: DateTime!) {
    session: update${user_type}(id: $id, data: { last_activity_at: $last_activity_at }) {
      record: data {
        id
        attributes {
          email
          full_name
          last_activity_at
        }
      }
    }
    }`;
}

/**
 *
 * @param guid agent.id or customer.id
 * @param email agent.email or customer.email
 * @param user_type Customer || Agent
 * @returns
 */
export default async function updateSessionKey(guid: number, email: string, user_type: 'Customer' | 'Agent') {
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
      query: getUpdateSessionGql(user_type),
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

  const { birthday: birthdate, ...attributes } = record.attributes;
  let birthday;
  if (birthdate) {
    birthday = new Intl.DateTimeFormat('en-CA').format(new Date(`${birthdate}T00:00:00`));
  }

  return {
    ...attributes,
    session_key: `${encrypt(dt)}.${encrypt(email)}`,
    birthday,
    id: guid,
    email,
  };
}

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

export async function getNewSessionKey(previous_token: string) {
  const id = Number(previous_token.split('-')[1]);
  const { data: response_data } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gqlFindCustomer,
      variables: {
        id,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${previous_token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response_data.data?.customer?.data?.attributes) {
    const { email, last_activity_at } = response_data.data?.customer?.data?.attributes;
    const encrypted_email = encrypt(email);
    const compare_key = `${encrypt(last_activity_at)}.${encrypted_email}`;

    if (compare_key === previous_token && !isNaN(Number(id))) {
      return await updateSessionKey(Number(id), email, 'Customer');
    }
  }
}
