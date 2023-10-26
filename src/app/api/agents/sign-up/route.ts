import { encrypt } from '@/_utilities/encryption-helper';
import { getResponse } from '../../response-helper';
import axios from 'axios';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { sendTemplate } from '../../send-template';
import { MessageRecipient } from '@mailchimp/mailchimp_transactional';
import { createAgent } from '../model';
import { RealtorInput } from '@/_typings/user';

const gql_find_agent = `query RetrieveAgentRecord($agent_id: String!) {
    agents(filters: { agent_id: { eq: $agent_id } }) {
      data {
        id
        attributes {
          agent_id
          email
          full_name
        }
      }
    }
}`;

const gql_find_realtor = `query RetrieveRealtorUserRecord($email: String!) {
    realtors(filters: { email: { eq: $email } }) {
      data {
        id
        attributes {
          email
          full_name
          last_activity_at
          agent {
            data {
              id
            }
          }
        }
      }
    }
}`;

const gql_update_agent = `mutation UpdateAgent ($id: ID!, $data: AgentInput!) {
  updateAgent(id: $id, data: $data) {
    data {
      id
      attributes {
        domain_name
        webflow_domain
      }
    }
  }
}`;

const gql_create_realtor = `mutation SignUp ($data: RealtorInput!) {
  createRealtor(data: $data) {
    data {
      id
      attributes {
        email
        full_name
        last_activity_at
        is_verified
        agent {
          data {
            id
            attributes {
              full_name
              email
              phone
            }
          }
        }
      }
    }
  }
}`;

export async function POST(req: Request) {
  const data = await req.json();
  const { agent_id, user, stripe } = data as {
    agent_id: string;
    user: {
      email: string;
      password: string;
      full_name: string;
      agent_id: string;
      phone: string;
    };
    stripe: {
      customer_id: string;
      subscriptions: {
        [key: string]: {
          invoice: string;
        };
      };
    };
  };
  const errors = checkForFieldErrors(user);

  if (Object.keys(errors).length > 0) return getResponse({ errors }, 400);

  if (user.email && user.password && user.full_name && agent_id) {
    const encrypted_password = encrypt(user.password);
    let { attributes: agent_profile, id } = await searchAgentById(agent_id);
    let existing_id = Number(id);
    let status_code = 202;
    let session_key = '';

    if (!existing_id) {
      const { attributes: new_agent, id: new_agent_id } = await createAgent({
        ...user,
        encrypted_password,
      });
      agent_profile = new_agent;
      id = new_agent_id;
      existing_id = Number(id);
      status_code = 201;
    }

    if (existing_id) {
      const { attributes: realtor, id: user_id } = await searchRealtorByEmail(user.email);

      if (realtor && Number(realtor.agent.data.id) === existing_id) {
        const url = new URL(req.url);
        const session_key = `${encrypt(realtor.last_activity_at)}.${encrypt(user.email)}-${user_id}`;
        const receipients: MessageRecipient[] = [
          {
            email: user.email,
            name: user.full_name,
          },
        ];
        await sendTemplate('welcome-agent', receipients, {
          send_to_email: user.email,
          password: user.password,
          dashboard_url: `${url.origin}/my-profile?key=${session_key}`,
          from_name: 'Leagent Team',
          subject: 'Welcome aboard!',
        });
        return getResponse({
          agent: {
            ...agent_profile,
            id: existing_id,
          },
          realtor: {
            ...realtor,
            id: user_id,
          },
          session_key,
        });
      }
    } else {
      return getResponse(
        {
          agent_profile,
          data,
          error: 'Unable to sign up with the data given',
        },
        400,
      );
    }

    const claimed = await claimAgent(
      existing_id,
      {
        email: user.email,
        full_name: agent_profile.full_name,
        login_email: user.email,
        phone_number: agent_profile.phone || user.phone,
        encrypted_password,
      },
      stripe,
    );

    if (claimed.errors) return getResponse(claimed, 400);

    let agent_record_id: number | undefined = undefined;
    if (claimed.attributes.agent?.data?.id) {
      agent_record_id = Number(claimed.attributes.agent?.data?.id);
    }
    const user_record = {
      ...claimed.attributes,
      agent: {
        ...(claimed.attributes.agent?.data?.attributes || {}),
        id: agent_record_id,
        agent_id: data.agent_id,
      },
      id: Number(claimed.id),
    };
    session_key = `${encrypt(claimed.attributes.last_activity_at)}.${encrypt(claimed.attributes.email)}-${claimed.id}`;
    const receipients: MessageRecipient[] = [
      {
        email: claimed.attributes.email,
        name: claimed.attributes.full_name,
      },
      // {
      //   email: 'team@leagent.com',
      //   name: 'The Leagent Team',
      //   type: 'bcc',
      // },
    ];
    const url = new URL(req.url);
    await sendTemplate('welcome-agent', receipients, {
      send_to_email: claimed.attributes.email,
      password: user.password,
      dashboard_url: `${url.origin}/my-profile?key=${session_key}`,
      from_name: 'Leagent Team',
      subject: 'Welcome aboard!',
    });

    return getResponse(
      {
        user: user_record,
        session_key,
      },
      status_code,
    );
  }

  return getResponse(
    {
      message: 'Nothing to do here',
    },
    200,
  );
}

function checkForFieldErrors(data: { [key: string]: any }) {
  let errors: { [key: string]: string[] } = {};
  if (!data.email)
    errors = {
      ...errors,
      email: ['required'],
    };
  if (!data.full_name)
    errors = {
      ...errors,
      full_name: ['required'],
    };
  if (!data.password)
    errors = {
      ...errors,
      password: ['required'],
    };
  return errors;
}

async function searchRealtorByEmail(email: string) {
  const response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_find_realtor,
      variables: {
        email,
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
  return response_data?.data?.realtors?.data[0] || {};
}

async function searchAgentById(agent_id: string) {
  const response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_find_agent,
      variables: {
        agent_id,
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
  return response_data?.data?.agents?.data[0] || {};
}

/**
 * Creates a domain (under the rexify project) using Vercel's API
 * @param domain_name string
 * @param agent_record_id number agents.id
 */
async function createRealtorVercelDomain(domain_name: string, id: number) {
  console.log(`Creating vercel domain ${domain_name}`);
  try {
    const vercel_headers = {
      Authorization: `Bearer ${process.env.NEXT_APP_VERCEL_TOKEN as string}`,
      'Content-Type': 'application/json',
    };

    const vercel_domains_api_url = `https://api.vercel.com/v9/projects/rexify/domains?teamId=${process.env.NEXT_APP_VERCEL_TEAM_ID}`;

    const vercel_response = await axios.post(vercel_domains_api_url, { name: domain_name }, { headers: vercel_headers });

    if (vercel_response.data?.name) {
      const updated_domain = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_update_agent,
          variables: {
            id,
            data: {
              domain_name: vercel_response.data?.name,
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
      if (updated_domain.data?.data?.updateAgent?.data?.attributes?.domain_name) {
        console.log('Updated domain name to', updated_domain.data.data.updateAgent.data.attributes.domain_name);
      }
    }
  } catch (e) {
    console.log('Unable to successfully create vercel domain.');
  }
}

async function claimAgent(
  id: number,
  user_data: { email: string; encrypted_password: string; full_name: string; login_email: string; phone_number: string },
  stripe_data: {
    customer_id: string;
    subscriptions: { [key: string]: { [key: string]: string } };
  },
) {
  const { customer_id: stripe_customer, subscriptions: stripe_subscriptions } = stripe_data;
  const last_activity_at = new Date().toISOString();
  const input: RealtorInput = {
    email: user_data.login_email.toLowerCase(),
    encrypted_password: user_data.encrypted_password,
    full_name: user_data.full_name,
    phone_number: user_data.phone_number,
    is_verified: user_data.email.toLowerCase() === user_data.login_email.toLowerCase(),
    last_activity_at,
    agent: Number(id),
    stripe_customer,
    stripe_subscriptions,
  };

  const realtor_response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_create_realtor,
      variables: {
        data: input,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const { data: response_data } = realtor_response;
  let error = '';
  let errors: {
    [key: string]: string[];
  } = {};
  if (response_data.errors) {
    response_data.errors.forEach((e: { [key: string]: any }) => {
      if (e.extensions?.error?.details?.errors) {
        e.extensions?.error.details.errors.forEach(({ path, message }: { path: string[]; message: string }) => {
          error = `${error}\n${(errors[path[0]] || [])
            .concat([message.split('This attribute').join(capitalizeFirstLetter(path[0])).split('must be unique').join('is already taken')])
            .join('\n')}`;
          errors = {
            ...errors,
            [path[0]]: (errors[path[0]] || []).concat([
              message.split('This attribute').join(capitalizeFirstLetter(path[0])).split('must be unique').join('is already taken'),
            ]),
          };
        });
      }
    });
    return { error, errors };
  }
  return response_data?.data?.createRealtor?.data || {};
}
