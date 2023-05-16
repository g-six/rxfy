import axios from 'axios';
import Cookies from 'js-cookie';
import { objectToQueryString } from '../url-helper';

/**
 * Retrieves a property by mls_id
 * @returns property data
 */
export async function getMLSProperty(mls_id: string) {
  const response = await axios.get(`/api/properties?mls_id=${mls_id}`, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const { session_key, property } = response.data;

    if (session_key) {
      Cookies.set('session_key', session_key);
    } else {
      console.log('Warning: no new session key has bee issued in retrieveDocuments()');
    }

    return property;
  }

  return response;
}

/**
 * Retrieves a property by mls_id
 * @returns property data
 */
export async function getSimilarProperties(property: { [key: string]: string }) {
  let filters: Record<string, string> = {};
  Object.keys(property).forEach(filter => {
    if (['property_type', 'lat', 'lon', 'beds'].includes(filter)) {
      filters = {
        ...filters,
        [filter]: filter === 'property_type' ? encodeURIComponent(property[filter]) : property[filter],
      };
    }
  });
  const url = `/api/similar-properties?mls=${property.mls_id}&${objectToQueryString(filters)}`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
      'Content-Type': 'application/json',
    },
  });
  const { listings } = response.data || { listings: [] };
  return listings;
}
