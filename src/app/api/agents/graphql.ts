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
      search_highlights
      brokerage_name
      brokerage_id
      profile_slug
      head_code
      footer_code
      ogimage_url
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
export const gql_by_agent_id = `query Agent($agent_id: String!) {
    agents(filters: { agent_id: { eqi: $agent_id } }) {
      data {${GQ_FRAG_AGENT}}
    }
}`;

export const gql_agent_inventory = `query AgentInventory($agent: ID!) {
  inventory: agentInventories(filters: { agent: { id: { eq: $agent } } }) {
    records: data {
      id
      attributes {
        property {
          data {
            attributes {
              title
              postal_zip_code
              state_province
              asking_price
              property_type
              style_type
              beds 
              baths
              property_photo_album {
                data {
                  attributes {
                    photos
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
