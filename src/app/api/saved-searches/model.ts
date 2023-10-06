import { SavedSearchInput, SavedSearchOutput } from '@/_typings/saved-search';
import axios from 'axios';
import { gql_my_saved_searches } from './gql';
import { SavedSearchGraph } from './data-types';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

export async function createSavedSearch(agent: number, search_params: SavedSearchInput, customer: number) {
  let params = {};
  Object.keys(search_params).forEach(k => {
    if (!['place_id', 'center'].includes(k)) {
      const kv = search_params as unknown as { [key: string]: unknown };
      params = {
        ...params,
        [k]: kv[k],
      };
    }
  });

  const { data: search_response } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_create_saved_search,
      variables: {
        data: {
          customer,
          ...params,
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

export async function retrieveSavedSearches(customer_id: number) {
  const xhr = await fetch(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, {
    method: 'POST',
    body: JSON.stringify({
      query: gql_my_saved_searches,
      variables: {
        customer_id,
      },
    }),
    headers,
  });

  try {
    const json = await xhr.json();
    const {
      data: {
        savedSearches: { records },
      },
    } = json as {
      data: {
        savedSearches: {
          records: SavedSearchGraph[];
        };
      };
    };
    return records.map(record => ({
      ...record.attributes,
      id: Number(record.id),
    })) as SavedSearchOutput[];
  } catch (e) {
    console.error('Error in api/saved-searches.model.retrieveSavedSearches');
    console.error(e);
    console.error('End of error in api/saved-searches.model.retrieveSavedSearches');
  }
  return [];
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
                year_built
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
