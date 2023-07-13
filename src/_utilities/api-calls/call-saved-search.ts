import { CustomerSavedSearch, SavedSearchInput } from '@/_typings/saved-search';
import axios from 'axios';
import Cookies from 'js-cookie';
import { queryStringToObject } from '../url-helper';
import { DwellingType } from '@/_typings/property';
import { getSelectedPropertyTypeId } from '../data-helpers/dwelling-type-helper';

/**
 * Save a customer map search
 * @param agent { id, logo? }
 * @param opts { search_url?, search_params? }
 * @returns
 */
export async function saveSearch(
  agent: { id: number; logo?: string },
  opts: { agent_customer_id?: number; search_url?: string; search_params?: SavedSearchInput; customer?: number },
) {
  let { search_params, customer, agent_customer_id } = opts || {};
  if (!search_params || Object.keys(search_params).length === 0) {
    if (opts.search_url) {
      search_params = queryStringToObject(opts.search_url);
    }
  }

  let { dwelling_types, dwelling_type_ids, types } = search_params || {
    dwelling_type_ids: [],
  };

  dwelling_types?.forEach(code_csv => {
    if (!dwelling_type_ids) {
      dwelling_type_ids = [];
    }

    if (code_csv === DwellingType.APARTMENT_CONDO) dwelling_type_ids = dwelling_type_ids.concat([1]);
    if (code_csv === DwellingType.TOWNHOUSE) dwelling_type_ids = dwelling_type_ids.concat([2]);
    if (code_csv === DwellingType.HOUSE) {
      dwelling_type_ids = dwelling_type_ids.concat([3, 4, 11, 12]);
    }
    if (code_csv === DwellingType.DUPLEX) {
      dwelling_type_ids = dwelling_type_ids.concat([8, 9]);
    }
    if (code_csv === DwellingType.ROW_HOUSE) {
      dwelling_type_ids = dwelling_type_ids.concat([5]);
    }
    if (code_csv === DwellingType.MANUFACTURED) {
      dwelling_type_ids = dwelling_type_ids.concat([6]);
    }
    if (code_csv === DwellingType.OTHER) {
      dwelling_type_ids = dwelling_type_ids.concat([10]);
    }
  });
  types?.split('/').forEach((ptype: string) => {
    if (!dwelling_type_ids) {
      dwelling_type_ids = [];
    }
    dwelling_type_ids = dwelling_type_ids.concat(getSelectedPropertyTypeId(ptype));
  });

  const response = await axios.post(
    `/api/${agent_customer_id ? `agents/customer/${agent_customer_id}/searches` : 'saved-searches'}`,
    {
      search_params: {
        ...search_params,
        dwelling_types: dwelling_type_ids,
        dwelling_type_ids: undefined,
        dwelling_type: undefined,
        types: undefined,
      },
      customer,
      agent: agent.id,
      logo: agent.logo,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 200) {
    const { session_key, ...record } = response.data;
    if (session_key) {
      Cookies.set('session_key', session_key);
    }
    return record;
  }

  return response;
}

/**
 * Update a customer map search
 * @param agent { id, logo? }
 * @param opts { search_url?, search_params? }
 * @returns
 */
export async function updateSearch(id: number, agent: { id: number; logo?: string }, opts: { search_url?: string; search_params?: SavedSearchInput }) {
  let { search_params } = opts || {};
  if (!search_params || Object.keys(search_params).length === 0) {
    if (opts.search_url) {
      search_params = queryStringToObject(opts.search_url);
    }
  }

  let { dwelling_types, types } = search_params || {};
  let dwelling_type_ids: number[] = search_params?.dwelling_type_ids || [];

  dwelling_types?.forEach(code_csv => {
    if (code_csv === DwellingType.APARTMENT_CONDO) dwelling_type_ids = dwelling_type_ids.concat([1]);
    if (code_csv === DwellingType.TOWNHOUSE) dwelling_type_ids = dwelling_type_ids.concat([2]);
    if (code_csv === DwellingType.HOUSE) {
      dwelling_type_ids = dwelling_type_ids.concat([3, 4, 11, 12]);
    }
    if (code_csv === DwellingType.DUPLEX) {
      dwelling_type_ids = dwelling_type_ids.concat([8, 9]);
    }
    if (code_csv === DwellingType.ROW_HOUSE) {
      dwelling_type_ids = dwelling_type_ids.concat([5]);
    }
    if (code_csv === DwellingType.MANUFACTURED) {
      dwelling_type_ids = dwelling_type_ids.concat([6]);
    }
    if (code_csv === DwellingType.OTHER) {
      dwelling_type_ids = dwelling_type_ids.concat([10]);
    }
  });

  types?.split('/').forEach((ptype: string) => {
    dwelling_type_ids = dwelling_type_ids.concat(getSelectedPropertyTypeId(ptype));
  });

  const response = await axios.put(
    `/api/saved-searches/${id}`,
    {
      search_params: {
        ...search_params,
        dwelling_types: dwelling_type_ids,
        dwelling_type: undefined,
        dwelling_type_ids: undefined,
        types: undefined,
      },
      agent: agent.id,
      logo: agent.logo,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 200) {
    const { session_key, ...record } = response.data;
    if (session_key) {
      Cookies.set('session_key', session_key);
    }
    return record;
  }

  return response;
}

export async function deleteSearch(id: number) {
  if (Cookies.get('session_key')) {
    const xhr = await axios.delete(`/api/saved-searches/${id}`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
      },
    });

    if (xhr?.data?.session_key) Cookies.set('session_key', xhr.data.session_key);
    return xhr?.data?.record || {};
  }
  return;
}

export async function getSearches(customer_id?: number) {
  if (Cookies.get('session_key')) {
    const xhr = await axios.get(`/api/${customer_id ? `agents/customer/${customer_id}/searches` : 'saved-searches'}`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
      },
    });

    if (xhr?.data?.session_key) Cookies.set('session_key', xhr.data.session_key);
    return (
      xhr?.data?.records.map((record: CustomerSavedSearch) => {
        let cleaned = {};
        Object.keys(record).forEach(key => {
          const kv = record as unknown as { [key: string]: unknown };
          cleaned = {
            ...cleaned,
            [key]: kv[key] || undefined,
          };
        });
        return cleaned;
      }) || []
    );
  }
  return;
}
