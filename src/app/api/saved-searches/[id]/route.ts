import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../../response-helper';
import { gqf_saved_search_attributes } from '../route';
import axios, { AxiosError } from 'axios';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_update_search = `mutation UpdateSavedSearch($id: ID!, $updates: SavedSearchInput!) {
    updateSavedSearch(id: $id, data: $updates) {
        data {
            id
            attributes {${gqf_saved_search_attributes}}
        }
    }
}`;

const gql_delete_search = `mutation DeleteSavedSearch($id: ID!) {
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

export async function DELETE(request: Request) {
  let session_key = '';
  let error;
  let data = {};
  try {
    const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
    session_key = `${token}-${guid}`;

    const id = Number(request.url.split('/').pop());
    try {
      const { data: delete_response } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_delete_search,
          variables: {
            id,
          },
        },
        {
          headers,
        },
      );

      data = {
        ...data,
        record: delete_response.data.deleteSavedSearch.data,
      };
    } catch (e) {
      error = 'Caught exception on DELETE method in \n  saved-searches/[id]/route.ts';
      console.log(error);
      const axios_error = e as AxiosError;
      console.log(axios_error.response?.data);
    }
  } catch (e) {
    error = 'Caught Bearer exception on DELETE method in \n  saved-searches/[id]/route.ts';
    console.log(error);
  }

  return getResponse({ error, session_key, data }, error ? 400 : 200);
}

export async function PUT(request: Request) {
  let session_key = '';
  let error;
  let record = {};
  const { search_params } = await request.json();
  try {
    const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
    session_key = `${token}-${guid}`;

    const id = Number(request.url.split('/').pop());
    try {
      const { data: update_response } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_update_search,
          variables: {
            id,
            updates: search_params,
          },
        },
        {
          headers,
        },
      );

      const { id: record_id, attributes } = update_response.data.updateSavedSearch.data;

      const dwelling_types = attributes.dwelling_types.data.map(({ attributes: { name } }: { attributes: { name: string } }) => name);
      record = {
        ...record,
        ...attributes,
        dwelling_types,
        id: Number(record_id),
      };

      return getResponse({ record });
    } catch (e) {
      error = 'Caught exception on PUT method in \n  saved-searches/[id]/route.ts';
      console.log(error);
      const axios_error = e as AxiosError;
      console.log(axios_error);
    }
  } catch (e) {
    error = 'Caught Bearer exception on PUT method in \n  saved-searches/[id]/route.ts';
    console.log(error);
  }

  return getResponse({ error, session_key, record }, error ? 400 : 200);
}
