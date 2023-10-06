export const gqf_saved_search_attributes = `
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
