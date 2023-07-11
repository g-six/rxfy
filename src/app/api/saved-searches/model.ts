import { SavedSearchInput } from '@/_typings/saved-search';
import axios from 'axios';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

export async function createSavedSearch(agent: number, search_params: SavedSearchInput, customer: number) {
  const { data: search_response } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_create_saved_search,
      variables: {
        data: {
          customer,
          ...search_params,
        },
      },
    },
    {
      headers,
    },
  );

  if (search_response.data?.createSavedSearch?.data?.id) {
    const { id, attributes } = search_response.data?.createSavedSearch?.data;
    return {
      ...attributes,
      id: Number(id),
    };
  } else if (search_response.errors) {
    console.log(search_response.errors);
  }
}

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
                build_year
                tags
                last_email_at
                is_active
                minsqft
                maxsqft`;

const gql_create_saved_search = `mutation CreateSavedSearch ($data: SavedSearchInput!) {
    createSavedSearch(data: $data) {
      data {
        id
        attributes {
          ${gqf_saved_search_attributes}
        }
      }
    }
  }`;
