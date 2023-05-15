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
export const gql_by_email = `query Agent($email: String!) {
    agents(filters: { email: { eqi: $email } }) {
      data {${GQ_FRAG_AGENT}}
    }
}`;
