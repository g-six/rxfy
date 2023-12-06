export const gqf_saved_search_attributes = `
                agent_metatag {
                  data {
                    id
                    attributes {
                      agent_id
                      logo_for_dark_bg
                      logo_for_light_bg
                    }
                  }
                }
                search_url
                lat
                lng
                area
                beds
                baths
                city
                minprice
                maxprice
                nelat
                nelng
                swlat
                swlng
                zoom
                type
                sorting
                dwelling_types {
                  data {
                    id
                    attributes {
                      name
                      code
                    }
                  }
                }
                add_date
                year_built
                tags
                last_email_at
                is_active
                minsqft
                maxsqft`;
export const gqf_saved_search_attributes_ext = `${gqf_saved_search_attributes}
                customer {
                  data {
                    id
                    attributes {
                      email
                      full_name
                      agents_customers {
                        data {
                          attributes {
                            agent {
                              data {
                                attributes {
                                  full_name
                                  website_theme
                                  domain_name
                                  agent_metatag {
                                    data {
                                      attributes {
                                        logo_for_dark_bg
                                        logo_for_light_bg
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

export const gql_my_saved_searches = `query MySavedSearches($customer_id: ID!) {
    savedSearches(filters: { customer: { id: { eq: $customer_id } } }) {
      records: data {
        id
        attributes {
          ${gqf_saved_search_attributes}
        }
      }
    }
  }`;

export const mutation_update_search = `mutation UpdateSearch($id: ID!, $updates: SavedSearchInput!) {
  updateSavedSearch(id: $id, data: $updates) {
    data {
      attributes {
        last_email_at
      }
    }
  }
}`;

export const gql_to_notify = `query SavedSearches($last_email_at: DateTime!) {
  new_items: savedSearches(
    filters: {
      and: {
        last_email_at: null
        agent_metatag: { id: { not:null } }
        customer: { email: { not:null } }
      }
    }
    pagination: { limit: 5 }
  ) {
    data {
      id
      attributes {
        ${gqf_saved_search_attributes_ext}
      }
    }
  }
  resend: savedSearches(
    filters: {
      and: {
        last_email_at: {
          lt: $last_email_at
        }
        agent_metatag: { id: { not:null } }
        customer: { email: { not:null } }
      }
    }
    pagination: { limit: 5 }
    sort: "last_email_at:asc"
  ) {
    data {
      id
      attributes {
        ${gqf_saved_search_attributes_ext}
      }
    }
  }
}
`;

export const gql_update_search = `mutation UpdateSavedSearch($id: ID!, $updates: SavedSearchInput!) {
  updateSavedSearch(id: $id, data: $updates) {
      data {
          id
          attributes {${gqf_saved_search_attributes}}
      }
  }
}`;

export const gql_delete_search = `mutation DeleteSavedSearch($id: ID!) {
    updateSavedSearch(id: $id, data: { customer: null }) {
        data {
            id
        }
    }
    deleteSavedSearch(id: $id) {
        data {
            attributes {${gqf_saved_search_attributes}}
        }
    }
}`;
