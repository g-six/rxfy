import axios, { AxiosError } from 'axios';

import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../response-helper';
import { getNewSessionKey } from '../update-session';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

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
        attributes {
          ${gqf_saved_search_attributes}
        }
      }
    }
  }`;

export async function POST(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  if (!token || !guid)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  let session_key = `${token}-${guid}`;
  try {
    const { search_params } = await request.json();
    const { data: search_response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_create_saved_search,
        variables: {
          data: {
            customer: guid,
            ...search_params,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    let saved_search;
    if (search_response.data?.createSavedSearch?.data?.id) {
      const { id, attributes } = search_response.data?.createSavedSearch?.data;
      saved_search = {
        ...attributes,
        id,
      };
    } else if (search_response.errors) {
      console.log(search_response.errors);
    }

    return new Response(
      JSON.stringify(
        {
          saved_search,
          session_key,
        },
        null,
        4,
      ),
      {
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (e) {
    const error = e as AxiosError;
    console.log('Error in saving saved-searches.POST API');
    console.log(error.response?.data);
  }
}

export async function GET(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  let session_key = `${token}-${guid}`;
  if (!token || !guid || isNaN(guid)) {
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );
  }

  const xhr = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_my_saved_searches,
      variables: {
        customer_id: guid,
      },
    },
    {
      headers,
    },
  );

  let records = [];
  if (xhr?.data?.data?.savedSearches?.records?.length) {
    records = xhr.data.data.savedSearches.records.map((record: any) => {
      const { dwelling_types, ...attributes } = record.attributes;
      return {
        id: Number(record.id),
        ...attributes,
        dwelling_types: dwelling_types.data.map((dwelling_type: { id: number; attributes: { name: string; code: string } }) => {
          return {
            ...dwelling_type.attributes,
            id: dwelling_type.id,
          };
        }),
      };
    });
  }
  return getResponse(
    {
      records,
      session_key,
    },
    200,
  );
}

const gql_my_saved_searches = `query MySavedSearches($customer_id: ID!) {
  savedSearches(filters: { customer: { id: { eq: $customer_id } } }) {
    records: data {
      id
      attributes {
        ${gqf_saved_search_attributes}
      }
    }
  }
}`;
