import { encrypt } from '@/_utilities/encryption-helper';
import axios, { AxiosError } from 'axios';
import updateSessionKey from '../../update-session';

const gql_retrieve_clients = `query RetrieveClients($id: ID!) {
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

export async function POST(req: Request) {
  const data = await req.json();
  const errors = checkForFieldErrors(data);

  if (Object.keys(errors).length > 0) return getResponse({ errors }, 400);

  // No input errors, let's proceed
  const auth = await agentAuthLogin(data.email, data.password);
  if (!auth) {
    return getResponse({ data }, 401);
  }

  const { session_key, agent, ...user } = auth;
  return getResponse({ user, agent, session_key }, 200);
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
        realtors: {
          data: [realtor],
        },
      } = login_res.data.data;

      if (realtor) {
        record_id = Number(realtor.id);
        const { agent, ...realtor_data } = realtor.attributes;
        const { agent_metatag, customers, ...agent_data } = agent.data.attributes;
        const { session_key } = await updateSessionKey(record_id, email, 'realtor');

        return {
          id: record_id,
          ...realtor_data,
          agent: {
            ...agent_data,
            metatags: agent_metatag?.data
              ? {
                  ...agent_metatag.data.attributes,
                  id: Number(agent_metatag.data.id),
                }
              : {},
            customers: customers?.data
              ? customers.data.map((c: any) => ({
                  ...c.attributes,
                  id: Number(c.id),
                }))
              : [],
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
  } catch (e) {
    const { response, code } = e as AxiosError;
    if (code == 'ERR_BAD_REQUEST') {
      console.log({ code }, response?.data);
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

const gql_create_metatags = `mutation CreateAgentMetatag($metatag: AgentMetatagInput!) {
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
    realtors(filters: { email: { eq: $email }, encrypted_password: { eq: $encrypted_password } }) {
      data {
            id
            attributes {
                email
                last_activity_at
                agent {
                  data {
                    id
                    attributes {
                      agent_id
                      agent_metatag {
                        ${agent_metatags_data_fragment}
                      }
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
        }
    }
}`;

export const gql_set_agent_creds = `mutation SetAgentCredentials($id: ID!, $input: AgentInput!) {
    realtor: updateRealtor(id: $id, data: $input) {
      data {
        id
        attributes {
          last_activity_at
          agent {
            data {
              id
              attributes {
                agent_id
                email
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
