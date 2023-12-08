export const gql_find_realtor = `query FilterRealtors($filters: RealtorFiltersInput!) {
    realtors(filters: $filters) {
      data {
        id
        attributes {
          agent {
            data {
              id
              attributes {
                agent_id
                full_name
                agent_metatag {
                  data {
                    attributes {
                      logo_for_light_bg
                      logo_for_dark_bg
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
