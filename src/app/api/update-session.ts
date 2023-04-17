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
