import { AgentMetatags, AgentMetatagsInput } from '@/_typings/agent';
import { AgentData } from '@/_typings/agent';
import { encrypt } from '@/_utilities/encryption-helper';
import { repeatChar } from '@/_utilities/string-helper';
import axios, { AxiosError } from 'axios';
import updateSessionKey from '../../update-session';

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

const gql = `mutation SignUp ($data: CustomerInput!) {
  agents(data: $data) {
    data {
      id
      attributes {
        email
        full_name
        last_activity_at
        agents {
          data {
            id
            attributes {
              full_name
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

  // No input errors, let's proceed
  const auth = await agentAuthLogin(data.email, data.password);
  if (!auth) {
    return getResponse({}, 401);
  }
  //   if (auth?.profile_id && auth?.agent_id) {
  //     const record = await retrieveAgentMetatags(auth.agent_id);
  //     console.log(record);
  //   }

  const { session_key, agent } = auth;
  return getResponse({ email: data.email, user: { ...agent, session_key } }, 200);
}

async function retrieveAgentMetatags(agent_id: string): Promise<{
  agent?: unknown;
  metatag?: unknown;
}> {
  const { data: response_data } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_find_agent_by_agent_id,
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
  const [agent] = response_data.data?.agents?.data || [];
  const [agent_metatag] = response_data.data?.agentMetatags?.data || [];

  if (agent && agent.attributes) {
    const { id, attributes } = agent;
    return {
      agent: {
        id,
        ...attributes,
      },
      metatag:
        agent_metatag && agent_metatag.id
          ? {
              id: agent_metatag.id,
              ...agent_metatag.attributes,
            }
          : undefined,
    };
  }
  return {};
}
async function createAgentMetatags(metatag: AgentMetatagsInput): Promise<AgentMetatags> {
  const { data: response_data } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_create_metatags,
      variables: {
        metatag,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const { id, attributes } = response_data.data?.record?.data;
  return {
    id: Number(id),
    ...attributes,
  };
}

async function agentAuthLogin(email: string, password: string) {
  // Let's try new strapi first
  try {
    let encrypted_password = encrypt(password);
    let record_id = 0;

    let login_res = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_login,
        variables: {
          email,
          encrypted_password: encrypt(password),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (login_res && login_res.data) {
      const {
        agents: {
          data: [agent],
        },
      } = login_res.data.data;

      if (agent) {
        record_id = agent.id;
        const { session_key, last_activity_at } = await updateSessionKey(record_id, email, 'Agent');

        // Next, retrieve metatags
        const variables = {
          agent_id: agent.attributes.agent_id,
        };

        const metatag_res = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: gql_get_metatags,
            variables,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const {
          data: {
            data: {
              records: {
                data: [metatag],
              },
            },
          },
        } = metatag_res;

        if (!metatag) {
          console.log('metatag not found, user needs to update on the new dashboard!');
          return {
            agent,
            metatag,
          };
        }

        return {
          agent,
          metatag: {
            id: metatag,
            ...metatag.attributes,
          },
          session_key,
        };
      }
    }

    console.log('+-------------------------------------------+');
    console.log('  No linked record on our new system');
    console.log('  Logging user in via the old Strapi system');
    console.log(`  for user email: ${email}`);
    console.log('+-------------------------------------------+');

    login_res = await axios.post(
      `${process.env.NEXT_APP_STRAPI_URL}/auth/local`,
      {
        identifier: email,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const old_strapi = login_res.data;

    if (old_strapi?.jwt) {
      const { user, jwt } = old_strapi;
      if (user.profile && jwt) {
        const { id: profile_id, agent_id } = user.profile;
        // Find and update new strapi agent record
        const strapi_data = await retrieveAgentMetatags(agent_id);
        const agent = strapi_data.agent as AgentData;
        let metatag = strapi_data.metatag as AgentMetatags;

        console.log('retrieveAgentMetatags results:');
        console.log(JSON.stringify({ agent, metatag }, null, 4));
        console.log('');
        console.log('');
        if (agent) {
          if (metatag) {
            record_id = agent.id;
            console.log('Agent Metatag found in Strapi V4 agent.encrypted_password', agent.encrypted_password);
          } else {
            console.log(`No Agent Metatag in Strapi V4, so let's create one!`);
            const { profile } = user;
            const new_metatag = await createAgentMetatags({
              agent_id: agent.agent_id,
              logo_for_light_bg: profile.logo || profile.second_logo || '',
              logo_for_dark_bg: profile.second_logo || profile.logo || '',
              title: profile.full_agent_name || 'Leagent Realtor',
              favicon: profile.favicon || '',
              personal_title: profile.personal_ || 'Your go-to realtor',
              listings_title: profile.listings_title || 'My Listings',
              personal_bio: profile.agent_bio || '',
              search_highlights: profile.search_highlights || {},
              target_city: profile.target_city || '',
              profile_image: profile.agent_image?.url || '',
              instagram_url: profile.instagram || '',
              linkedin_url: profile.linkedin || '',
              twitter_url: profile.twitter || '',
              youtube_url: profile.youtube || '',
            });
            if (new_metatag?.id) {
              metatag = new_metatag;
              console.log('Created metatag', metatag);
            }
          }
        }

        if (record_id) {
          login_res = await axios.post(
            `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
            {
              query: gql_set_agent_creds,
              variables: {
                id: record_id,
                input: {
                  encrypted_password,
                  profile_id,
                  last_activity_at: new Date().toISOString(),
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
          const {
            agents: {
              data: [agent],
            },
            agentMetatags: {
              data: [agent_metatag],
            },
          } = login_res.data;
          return { agent, agent_metatag };
        }
      }
    }
  } catch (e) {
    const { code } = e as AxiosError;
    if (code == 'ERR_BAD_REQUEST') {
      return;
    }
    return;
  }

  return;
}

function checkForFieldErrors(data: { [key: string]: any }) {
  let errors: { [key: string]: string[] } = {};
  if (!data.email)
    errors = {
      ...errors,
      email: ['required'],
    };
  if (!data.password)
    errors = {
      ...errors,
      password: ['required'],
    };
  return errors;
}

function getResponse(data: { [key: string]: any }, status = 200 | 400 | 401 | 405) {
  return new Response(JSON.stringify(data, null, 4), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

const agent_metatags_data_fragment = `
        data {
            id
            attributes {
                agent_id
                favicon
                headshot
                target_city
                personal_bio
                personal_title
                brokerage_id
                brokerage_name
                search_highlights
                logo_for_light_bg
                logo_for_dark_bg
                title
                description
                profile_slug
                profile_image
                facebook_url
                linkedin_url
                twitter_url
                youtube_url
                mailchimp_subscription_url
            }
        }
`;
export const gql_get_metatags = `query GetAgentMetatag($agent_id: String!) {
    records: agentMetatags(filters: { agent_id: { eq: $agent_id } }) {
        ${agent_metatags_data_fragment}
    }
}`;

export const gql_create_metatags = `mutation CreateAgentMetatag($metatag: AgentMetatagInput!) {
    record: createAgentMetatag(data: $metatag) {
      data {
        id
        attributes {
          agent_id
          favicon
          headshot
          target_city
          personal_bio
          personal_title
          brokerage_id
          brokerage_name
          search_highlights
          logo_for_light_bg
          logo_for_dark_bg
          title
          description
          profile_slug
          profile_image
          facebook_url
            linkedin_url
          twitter_url
          youtube_url
          mailchimp_subscription_url
        }
      }
    }
}`;

export const gql_login = `query LoginAgent($email: String!, $encrypted_password: String!) {
    agents(filters: { email: { eq: $email }, encrypted_password: { eq: $encrypted_password } }) {
      data {
            id
            attributes {
                agent_id
                email
                encrypted_password
                last_activity_at
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
}`;

export const gql_set_agent_creds = `mutation SetAgentCredentials($id: ID!, $input: AgentInput!) {
    agent: updateAgent(id: $id, data: $input) {
      data {
        id
        attributes {
          agent_id
          email
          last_activity_at
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

export const gql_find_agent_by_agent_id = `query RetrieveAgentByAgentId($agent_id: String!) {
    agents(filters: { agent_id: { eq: $agent_id } }) {
      data {
            id
            attributes {
                agent_id
                encrypted_password
                last_activity_at
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
    agentMetatags(filters: { agent_id: { eq: $agent_id } }) {
        ${agent_metatags_data_fragment}
    }
}`;
