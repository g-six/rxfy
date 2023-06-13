import { BrokerageInputModel } from '@/_typings/agent';
import { encrypt } from '@/_utilities/encryption-helper';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import axios, { AxiosError } from 'axios';
import { GQ_FRAG_AGENT } from './agents/graphql';

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
          stripe_customer
          stripe_subscriptions
          agent {
            data {${GQ_FRAG_AGENT}}
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

const SESSION_LIFE_SECS = 60 * 90; // seconds * minutes
/**
 *
 * @param guid agent.id or customer.id
 * @param email agent.email or customer.email
 * @param user_type Customer || Agent
 * @returns
 */
export default async function updateSessionKey(guid: number, email: string, user_type: 'customer' | 'realtor') {
  try {
    const ts = new Date().getTime();
    const last_activity_at = new Date(ts).toISOString();
    const expires_at = new Date(Date.now() + SESSION_LIFE_SECS * 1000);
    const now = Math.ceil(Date.now() / 1000);
    const expires_in = now - Math.ceil(ts / 1000) - SESSION_LIFE_SECS;

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
          last_activity_at,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const { birthday: birthdate, brokerage: brokerage_results, agent_metatag, ...attributes } = record.attributes;
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
      metatags: agent_metatag?.data
        ? {
            ...agent_metatag.data.attributes,
            id: Number(agent_metatag.data.id),
          }
        : undefined,
      session_key: `${encrypt(last_activity_at)}.${encrypt(email)}-${guid}`,
      last_activity_at,
      expires_in,
      expires_at,
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
          yes_to_marketing
          agents {
            data {${GQ_FRAG_AGENT}
            }
          }`
              : `first_name
          last_name
          phone_number
          stripe_customer
          stripe_subscriptions
          agent {
            data {${GQ_FRAG_AGENT}
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

export async function getUserDataFromSessionKey(session_hash: string, id: number, user_type: 'customer' | 'realtor' = 'customer') {
  const response = await axios.post(
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
  const response_data = response ? response.data : {};

  if (response_data.data?.user?.data?.attributes) {
    const { email, agent, agents, brokerages, last_activity_at, stripe_customer, stripe_subscriptions, ...fields } = response_data.data?.user?.data?.attributes;
    const now = Math.ceil(Date.now() / 1000);
    const expires_at = new Date(new Date(last_activity_at).getTime() + SESSION_LIFE_SECS * 1000);
    const expires_in = Math.ceil(expires_at.getTime() / 1000) - now;
    let full_name = fields.full_name;
    if (!full_name) {
      if (agent?.data?.attributes?.full_name) {
        full_name = agent.data.attributes.full_name;
      }
    }
    const encrypted_email = encrypt(email);
    const compare_key = `${encrypt(last_activity_at)}.${encrypted_email}`;
    const brokerage =
      brokerages?.data && brokerages.data.length
        ? {
            ...brokerages.pop().attributes,
          }
        : undefined;
    if (compare_key === session_hash && !isNaN(Number(id))) {
      let agent_metatag = agent?.data?.attributes?.agent_metatag?.data || {};

      agent_metatag = {
        ...agent_metatag.attributes,
        id: agent_metatag.id ? Number(agent_metatag.id) : undefined,
      };

      let real_estate_board = agent?.data?.attributes?.real_estate_board?.data || {};

      real_estate_board = {
        ...real_estate_board.attributes,
        id: real_estate_board.id ? Number(real_estate_board.id) : undefined,
      };
      return {
        id,
        agent: agent
          ? {
              ...agent.data.attributes,
              agent_metatag,
              real_estate_board,
              id: Number(agent.data.id),
            }
          : undefined,
        brokerage: brokerage as unknown as BrokerageInputModel,
        full_name,
        email,
        user_type,
        last_activity_at,
        expires_at,
        expires_in,
        session_key: `${session_hash}-${id}`,
        stripe_customer,
        stripe_subscriptions,
      };
    }
  }

  return {};
}
export async function getNewSessionKey(previous_token: string, id: number, user_type: 'customer' | 'realtor' = 'customer', renew = true) {
  const results = await getUserDataFromSessionKey(previous_token, id, user_type);
  const now = Math.ceil(Date.now() / 1000);
  let expires_in = results.expires_in || 0;
  if (results.email) {
    if (results.last_activity_at) {
      // session life is at 2 hours
      if (expires_in > 0) {
        return {
          ...results,
          expires_in,
        };
      } else if (!renew) {
        return {};
      }
    }
    try {
      const new_session = await updateSessionKey(id, results.email, user_type);
      const ts = Math.ceil(new Date(new_session.last_activity_at).getTime() / 1000);
      expires_in = now - ts + SESSION_LIFE_SECS;
      console.log('Expires at', new_session.expires_at);
      return {
        ...results,
        ...new_session,
        expires_in,
      };
    } catch (e) {
      return {};
    }
  } else {
    console.log(`Mismatched Session Tokens for ${id} ${previous_token}`);
    return {};
  }
}
