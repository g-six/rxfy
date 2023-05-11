import { encrypt } from '@/_utilities/encryption-helper';
import { getResponse } from '../../response-helper';
import axios, { AxiosError } from 'axios';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { sendTemplate } from '../../send-template';
import { MessageRecipient } from '@mailchimp/mailchimp_transactional';
import { emailToSlug } from '@/_utilities/string-helper';
import { WEBFLOW_THEME_DOMAINS } from '@/_typings/webflow';

export const gql_find_agent = `query RetrieveAgentRecord($agent_id: String!) {
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
export const gql_create_agent = `mutation CreateAgentRecord($data: AgentInput!) {
    createAgent(data: $data) {
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

export const gql_retrieve_clients = `query RetrieveClients($id: ID!) {
    agent(id: $id) {
      data {
        attributes {
          agent_id
          customers {
            data {
              id
              attributes {
                full_name
                email
                birthday
                phone_number
                loves {
                  data {
                    id
                    attributes {
                      property {
                        data {
                          attributes {
                            title
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

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
  const errors = checkForFieldErrors(data);

  if (Object.keys(errors).length > 0) return getResponse({ errors }, 400);

  if (data.email && data.password && data.full_name && data.agent_id) {
    const encrypted_password = encrypt(data.password);
    let { attributes: agent_profile, id } = await searchAgentById(data.agent_id);
    let existing_id = Number(id);
    let status_code = 202;
    let user = {};
    let session_key = '';

    if (!existing_id) {
      const { attributes: new_agent, id: new_agent_id } = await createAgent({
        ...data,
        encrypted_password,
      });
      agent_profile = new_agent;
      id = new_agent_id;
      existing_id = Number(id);
      status_code = 201;
    }

    if (!existing_id)
      return getResponse(
        {
          agent_profile,
          data,
          error: 'Unable to sign up with the data given',
        },
        400,
      );

    const claimed = await claimAgent(existing_id, {
      email: agent_profile.email,
      full_name: data.full_name,
      login_email: data.email,
      encrypted_password,
    });

    if (claimed.errors) return getResponse(claimed, 400);

    let agent_record_id: number | undefined = undefined;
    if (claimed.attributes.agent?.data?.id) {
      agent_record_id = Number(claimed.attributes.agent?.data?.id);
    }
    user = {
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
      {
        email: 'team@leagent.com',
        name: 'The Leagent Team',
        type: 'bcc',
      },
    ];
    const url = new URL(req.url);
    await sendTemplate('welcome-agent', receipients, {
      send_to_email: claimed.attributes.email,
      dashboard_url: `${url.origin}/my-profile?key=${session_key}`,
      from_name: 'Leagent Team',
      subject: 'Welcome aboard!',
    });

    return getResponse(
      {
        user,
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

async function claimAgent(id: number, user_data: { email: string; encrypted_password: string; full_name: string; login_email: string }) {
  const last_activity_at = new Date().toISOString();
  const RealtorInput = {
    email: user_data.login_email.toLowerCase(),
    encrypted_password: user_data.encrypted_password,
    full_name: user_data.full_name,
    is_verified: user_data.email.toLowerCase() === user_data.login_email.toLowerCase(),
    last_activity_at,
    agent: Number(id),
  };

  const domain_name = `r${id}.leagent.com`;

  console.log(`Creating vercel domain ${domain_name}`);
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

  console.log(JSON.stringify({ RealtorInput }, null, 4));

  const realtor_response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_create_realtor,
      variables: {
        data: RealtorInput,
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
  console.log(JSON.stringify(response_data, null, 4));
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

async function createAgent(user_data: { agent_id: string; email: string; encrypted_password: string; full_name: string }) {
  try {
    const agent_response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_create_agent,
        variables: {
          data: {
            agent_id: user_data.agent_id,
            email: user_data.email,
            full_name: user_data.full_name,
            first_name: user_data.full_name.split(' ')[0] || '',
            last_name: user_data.full_name.split(' ').pop(),
            webflow_domain: WEBFLOW_THEME_DOMAINS.DEFAULT,
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

    return agent_response?.data?.data?.createAgent?.data || {};
  } catch (e) {
    console.log('Error in createAgent');
    const axerr = e as AxiosError;
    const { error, errors } = axerr.response?.data as {
      error?: {
        code: string;
      };
      errors?: {
        message: string;
        extensions: unknown[];
      }[];
    };
    console.log(
      JSON.stringify(
        {
          error,
          errors,
        },
        null,
        4,
      ),
    );
  }
  return {};
}
