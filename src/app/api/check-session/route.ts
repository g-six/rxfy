import axios from 'axios';
import Stripe from 'stripe';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../response-helper';
import { getNewSessionKey } from '../update-session';
import { GQ_FRAG_AGENT } from '../agents/graphql';
import { CustomerRecord } from '@/_typings/customer';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

function gqlFindUser(user_type: 'realtor' | 'customer') {
  return `query FindUser($id: ID!) {
    user: ${user_type}(id: $id) {
      data {
        id
        attributes {
          full_name
          email
          phone_number
          last_activity_at
          ${
            user_type === 'customer'
              ? `birthday
          yes_to_marketing`
              : `first_name
          last_name
          agent {
            data {${GQ_FRAG_AGENT}}
          }`
          }
        }
      }
    }
  }`;
}

export async function getUserById(id: number, user_type: 'realtor' | 'customer' = 'customer') {
  const { data } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gqlFindUser(user_type),
      variables: {
        id,
      },
    },
    {
      headers,
    },
  );

  return data;
}

export async function GET(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );

  const user_type = request.url.split('/').includes('agent') ? 'realtor' : 'customer';

  const { email, full_name, last_activity_at, expires_in, session_key, first_name, last_name, ...session_data } = await getNewSessionKey(
    token,
    guid,
    user_type,
    false,
  );
  const { agent, birthday, brokerage, stripe_customer, stripe_subscriptions } = session_data;
  let phone_number = session_data.phone_number || session_data.phone || session_data.agent?.data?.attributes?.phone;
  if (email && last_activity_at && session_key) {
    let subscription: { [key: string]: string } = {};
    if (stripe_subscriptions) {
      const [subscription_id] = Object.keys(stripe_subscriptions);
      if (subscription_id) {
        const stripe = new Stripe(`${process.env.NEXT_APP_STRIPE_SECRET}`, {
          apiVersion: '2022-11-15',
        });
        const stripe_subscription = await stripe.subscriptions.retrieve(subscription_id);
        if (stripe_subscription.items.data[0].plan)
          if (stripe_subscription.items.data[0].plan.nickname) {
            subscription = {
              ...subscription,
              name: stripe_subscription.items.data[0].plan.nickname,
            };
          }
        if (stripe_subscription.items.data[0].plan.interval) {
          subscription = {
            ...subscription,
            interval: stripe_subscription.items.data[0].plan.interval,
          };
        }
      }
    }
    const customers: CustomerRecord[] = [];
    agent.customers.data.forEach((customer: unknown) => {
      const { id, attributes: agent_customer } = customer as {
        id: number;
        attributes?: {
          status: 'active' | 'lead' | 'closed';
          customer: {
            data: {
              id: number;
              attributes: {
                [key: string]: unknown;
              };
            };
          };
        };
      };
      agent_customer?.customer.data.attributes &&
        Object.keys(agent_customer?.customer.data.attributes).forEach(k => {
          if (agent_customer?.customer.data.attributes[k] === null) delete agent_customer?.customer.data.attributes[k];
        });
      const {
        full_name,
        email,
        birthday,
        last_activity_at,
        saved_searches: saved_recs,
      } = agent_customer?.customer.data.attributes as {
        full_name: string;
        birthday: string;
        last_activity_at: string;
        email: string;
        saved_searches: {
          data?: {
            id: number;
            attributes: {
              city?: string;
              minprice?: number;
              maxprice?: number;
              dwelling_types?: {
                data?: {
                  attributes: {
                    name: string;
                  };
                }[];
              };
            };
          }[];
        };
      };

      const saved_searches: {
        id: number;
        city?: string;
        minprice?: number;
        maxprice?: number;
        dwelling_types?: string[];
      }[] = [];

      saved_recs.data?.forEach(s => {
        const dwelling_types: string[] = [];
        if (s.attributes.dwelling_types?.data) {
          s.attributes.dwelling_types.data.forEach(dt => {
            dwelling_types.push(dt.attributes.name);
          });
        }
        let city, minprice, maxprice;
        if (s.attributes.city) city = s.attributes.city;
        if (s.attributes.minprice) minprice = s.attributes.minprice;
        if (s.attributes.maxprice) maxprice = s.attributes.maxprice;

        saved_searches.push({
          id: Number(s.id),
          city,
          minprice,
          maxprice,
          dwelling_types,
        });
      });

      customers.push({
        full_name,
        email,
        birthday,
        last_activity_at,
        status: agent_customer?.status || 'lead',
        id: Number(agent_customer?.customer.data.id),
        saved_searches,
      });
    });

    return getResponse(
      {
        ...agent,
        agent_metatag: undefined,
        customers,
        metatags: agent?.agent_metatag ? agent?.agent_metatag : undefined,
        brokerage,
        phone_number,
        stripe_customer,
        stripe_subscriptions,
        subscription,
        id: guid,
        expires_in,
        email,
        birthday,
        full_name: full_name || '',
        first_name: first_name || full_name?.split(' ')[0] || '',
        last_name: last_name || full_name?.split(' ').pop() || '',
        session_key,
        message: 'Logged in',
      },
      200,
    );
  }
  return getResponse(
    {
      token,
      error: 'Unable to sign in. Session token is invalid.',
    },
    401,
  );
}
