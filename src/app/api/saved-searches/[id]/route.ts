import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../../response-helper';
import axios, { AxiosError } from 'axios';
import { gqf_saved_search_attributes, gql_delete_search, gql_update_search } from '../gql';
import { removeSavedSearch, updateSavedSearch } from '../model';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

export async function DELETE(request: Request) {
  let session_key = '';
  let error;
  let data = {};
  try {
    const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
    session_key = `${token}-${guid}`;

    const id = Number(request.url.split('/').pop());
    try {
      const { data: delete_response } = await removeSavedSearch(id);

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
      const { data: update_response } = await updateSavedSearch(id, search_params);

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
      console.log(axios_error.response?.data);
    }
  } catch (e) {
    error = 'Caught Bearer exception on PUT method in \n  saved-searches/[id]/route.ts';
    console.log(error);
  }

  return getResponse({ error, session_key, record }, error ? 400 : 200);
}
