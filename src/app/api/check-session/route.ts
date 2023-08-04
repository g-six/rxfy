import axios from 'axios';
import Stripe from 'stripe';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../response-helper';
import { getNewSessionKey, gqlFindUser } from '../update-session';
import { CustomerRecord } from '@/_typings/customer';
import { getGeocode } from '@/_utilities/geocoding-helper';
import { AgentData } from '@/_typings/agent';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

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

function isRealtorRequest(url: string) {
  if (url.indexOf('/agents/customer') > 0) return true;
  return false;
}

export async function getUserSessionData(authorization: string, user_type: 'realtor' | 'customer') {
  const { token, guid } = getTokenAndGuidFromSessionKey(authorization);
  if (!token && isNaN(guid)) return { error: 'Please log in' };

  const { email, full_name, last_activity_at, expires_in, session_key, first_name, last_name, ...session_data } = await getNewSessionKey(
    token,
    guid,
    user_type,
    false,
  );
  const { agent, birthday, brokerage, stripe_customer, stripe_subscriptions, agents_customer } = session_data;
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

    let results: { [key: string]: unknown } = {
      phone_number,
      id: guid,
      expires_in,
      email,
      full_name: full_name || '',
      first_name: first_name || full_name?.split(' ')[0] || '',
      last_name: last_name || full_name?.split(' ').pop() || '',
      session_key,
      message: 'Logged in',
    };

    if (user_type === 'realtor') {
      const customers: CustomerRecord[] = [];
      agent.customers.data.forEach((customer: unknown) => {
        const { id: agent_customer_id, attributes: agent_customer } = customer as {
          id: number;
          attributes?: {
            status: 'active' | 'lead' | 'closed';
            notes?: {
              data: {
                id: number;
                attributes: {
                  body: string;
                  created_at: string;
                  realtor: {
                    data: {
                      id: number;
                    };
                  };
                };
              }[];
            };
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
          phone_number: customer_phone,
          last_activity_at,
          saved_searches: saved_recs,
        } = agent_customer?.customer.data.attributes as {
          full_name: string;
          birthday: string;
          phone_number: string;
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

        const notes: {
          id: number;
          body: string;
          realtor: number;
          created_at: string;
        }[] = agent_customer?.notes?.data
          ? agent_customer.notes.data.map(n => ({
              ...n.attributes,
              realtor: Number(n.attributes.realtor.data.id),
              id: Number(n.id),
            }))
          : [];

        customers.push({
          full_name,
          email,
          birthday,
          phone_number: customer_phone,
          last_activity_at,
          status: agent_customer?.status || 'lead',
          notes,
          id: Number(agent_customer?.customer.data.id),
          agent_customer_id: Number(agent_customer_id),
          saved_searches,
        });
      });

      let metatags = agent?.agent_metatag ? agent?.agent_metatag : undefined;
      if (metatags && metatags.target_city && !metatags.lat && !metatags.lng) {
        const results = await getGeocode(agent.agent_metatag.target_city);
        if (results?.geometry.location) {
          const { lat, lng } = results?.geometry.location;
          metatags = {
            ...metatags,
            lat,
            lng,
          };
        }
      }

      return {
        ...agent,
        ...results,
        agent: Number(agent.id),
        agent_metatag: undefined,
        metatags,
        brokerage,
        stripe_customer,
        stripe_subscriptions,
        subscription,
        customers,
      } as AgentData;
    } else {
      if (birthday)
        results = {
          ...results,
          birthday,
        };
    }

    return results;
  }
  return { error: 'Please log in' };
}
export async function GET(
  request: Request,
  {
    config,
    params,
  }: {
    [key: string]: {
      [key: string]: string;
    };
  },
) {
  let user_type: 'realtor' | 'customer' = request.url.split('/').includes('agent') ? 'realtor' : 'customer';
  if (isRealtorRequest(request.url)) {
    user_type = 'realtor';
  }
  const results = await getUserSessionData(request.headers.get('authorization') || '', user_type);
  const { error } = results as unknown as { error: string };
  if (error) return getResponse(results, 401);

  return config?.internal === 'yes' ? results : getResponse(results, 200);
}
