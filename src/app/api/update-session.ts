import { encrypt } from '@/_utilities/encryption-helper';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import axios, { AxiosError } from 'axios';
export const GQL_BROKERAGE_ATTRIBUTES = `
                name
                full_address
                phone_number
                website_url
                logo_url
                lat
                lon
`;
function getUpdateSessionGql(user_type: 'realtor' | 'customer') {
  return `mutation UpdateSession ($id: ID!, $last_activity_at: DateTime!) {
    session: update${capitalizeFirstLetter(user_type)}(id: $id, data: { last_activity_at: $last_activity_at }) {
      record: data {
        id
        attributes {
          email
          full_name
          last_activity_at
          ${
            user_type === 'customer'
              ? `birthday
          yes_to_marketing`
              : `first_name
          last_name
          phone_number
          agent {
            data {
              id
              attributes {
                agent_id
                phone
              }
            }
          }
          brokerage {
            data {
              id
              attributes {${GQL_BROKERAGE_ATTRIBUTES}
              }
            }
          }`
          }
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
export default async function updateSessionKey(guid: number, email: string, user_type: 'customer' | 'realtor') {
  try {
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

    const { birthday: birthdate, brokerage: brokerage_results, ...attributes } = record.attributes;
    let birthday;
    if (birthdate) {
      birthday = new Intl.DateTimeFormat('en-CA').format(new Date(`${birthdate}T00:00:00`));
    }

    let brokerage = brokerage_results?.data?.attributes || {};
    if (brokerage_results?.data?.id) {
      brokerage = {
        ...brokerage,
        id: Number(brokerage_results.data.id),
      };
    }

    return {
      ...attributes,
      session_key: `${encrypt(dt)}.${encrypt(email)}-${guid}`,
      birthday,
      brokerage,
      id: guid,
      email,
    };
  } catch (e) {
    const axerr = e as AxiosError;
    console.log(axerr.response?.data);
    console.log('Error in updateSessionKey');
  }
}

function gqlFindUser(user_type: 'realtor' | 'customer' = 'customer') {
  return `query FindUser($id: ID!) {
    user: ${user_type}(id: $id) {
      data {
        id
        attributes {
          email
          last_activity_at
          ${
            user_type === 'customer'
              ? `birthday
          yes_to_marketing`
              : `first_name
          last_name
          phone_number
          brokerage {
            data {
              id
              attributes {${GQL_BROKERAGE_ATTRIBUTES}
              }
            }
          }`
          }
        }
      }
    }
  }`;
}

export async function getNewSessionKey(previous_token: string, id: number, user_type: 'customer' | 'realtor' = 'customer') {
  const { data: response_data } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gqlFindUser(user_type),
      variables: {
        id,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response_data.data?.user?.data?.attributes) {
    const { email, last_activity_at } = response_data.data?.user?.data?.attributes;
    const encrypted_email = encrypt(email);
    const compare_key = `${encrypt(last_activity_at)}.${encrypted_email}`;

    if (compare_key === previous_token && !isNaN(Number(id))) {
      try {
        return await updateSessionKey(id, email, user_type);
      } catch (e) {
        return {};
      }
    } else {
      console.log(`Mismatched Session Tokens for ${id} ${previous_token}`);
      console.log(`Mismatched Session Tokens for ${id} ${compare_key}`);
    }
  }
}
