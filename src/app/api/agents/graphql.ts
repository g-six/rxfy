import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES } from '@/_typings/property';

export const GQ_FRAG_AGENT_METATAG = `
    id
    attributes {
      title
      description
      personal_title
      listings_title
      personal_bio
      favicon
      logo_for_dark_bg
      logo_for_light_bg
      profile_image
      headshot
      instagram_url
      facebook_url
      linkedin_url
      twitter_url
      youtube_url
      mailchimp_subscription_url
      target_city
      lat
      lng
      search_highlights
      brokerage_name
      brokerage_id
      profile_slug
      head_code
      footer_code
      ogimage_url
    }
`;
export const GQ_FRAG_AGENT_CUSTOMER = `data {
              id
              attributes {
                status
                notes {
                  data {
                    id
                    attributes {
                      body
                      realtor {
                        data {
                          id
                        }
                      }
                      created_at: createdAt
                    }
                  }
                }
                customer {
                  data {
                    id
                    attributes {
                      full_name
                      email
                      phone_number
                      birthday
                      last_activity_at
                      saved_searches(filters: { city: { notNull: true } }, pagination: { limit: 1 }, sort: "desc" ) {
                        data {
                          id
                          attributes {
                            city
                            minprice
                            maxprice
                            dwelling_types {
                              data {
                                attributes {
                                  name
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
export const GQ_FRAG_AGENT = `
        id
        attributes {
          agent_id
          email
          phone
          first_name
          last_name
          full_name
          website_theme
          street_1
          street_2
          api_key
          domain_name
          webflow_domain
          agent_metatag {
            data {${GQ_FRAG_AGENT_METATAG}}
          }
          customers(pagination: { limit: 200 }) {
            ${GQ_FRAG_AGENT_CUSTOMER}
          }
          real_estate_board {
            data {
              id
              attributes {
                name
                abbreviation
              }
            }
          }
        }
`;

export const gql_create_agent = `mutation CreateAgentRecord($data: AgentInput!) {
  createAgent(data: $data) {
    data {${GQ_FRAG_AGENT}}
  }
}`;

export const mutation_update_agent = `mutation UpdateAgent($id: ID!, $data: AgentInput!) {
  updateAgent(id: $id, data: $data) {
    data {${GQ_FRAG_AGENT}}
  }
}`;

export const mutation_update_agent_customer = `mutation UpdateAgentCustomer($id: ID!, $data: AgentsCustomerInput!) {
  updateAgentsCustomer(id: $id, data: $data) {
    ${GQ_FRAG_AGENT_CUSTOMER}
  }
}`;

export const mutation_create_meta = `mutation CreateMeta($data: AgentMetatagInput!) {
  createAgentMetatag(data: $data) {
    data {${GQ_FRAG_AGENT_METATAG}}
  }
}`;
export const mutation_update_meta = `mutation UpdateMeta($id: ID!, $data: AgentMetatagInput!) {
  updateAgentMetatag(id: $id, data: $data) {
    data {${GQ_FRAG_AGENT_METATAG}}
  }
}`;
export const gql_by_email = `query Agent($email: String!) {
    agents(filters: { email: { eqi: $email } }) {
      data {${GQ_FRAG_AGENT}}
    }
}`;
export const gql_by_agent_uniq = `query Agent($filters: AgentFiltersInput!) {
    agents(filters: $filters) {
      data {${GQ_FRAG_AGENT}}
    }
}`;

export const gql_by_realtor_id = `query GetRealtor($id: ID!) {
  realtor(id: $id) {
    data {
      attributes {
        email
        last_activity_at
        agent {
          data {${GQ_FRAG_AGENT}}
        }
      }
    }
  }
}`;

export const gql_agent_inventory = `query AgentInventory($agent: ID!) {
  inventory: agentInventories(filters: { agent: { id: { eq: $agent } } }) {
    records: data {
      id
      attributes {
        property {
          data {
            id
            attributes {
              ${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}
            }
          }
        }
      }
    }
  }
}`;
