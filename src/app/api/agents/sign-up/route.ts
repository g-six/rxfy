export const gql_find_agent = `query RetrieveClients($agent_id: String!) {
    agents(filters: { agent_id: { eq: $agent_id } }) {
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

  return getResponse(data, 200);
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

function getResponse(data: { [key: string]: any }, status = 200 | 400 | 401 | 405) {
  return new Response(JSON.stringify(data, null, 4), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}
