import axios from 'axios';
import Cookies from 'js-cookie';
import { objectToQueryString } from '../url-helper';
import { PropertyDataModel } from '@/_typings/property';

/**
 * Retrieves a property by mls_id
 * @returns property data
 */
export async function getMLSProperty(mls_id: string) {
  const response = await axios.get(`/api/properties/mls-id/${mls_id}`, {
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
 * Retrieves a property by agent record.id (STRAPI ID)
 * @returns property data
 */
export async function getAgentPublicListings() {
  const response = await axios.get(`/api/agents/inventory`, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const { session_key, properties } = response.data;

    if (session_key) {
      Cookies.set('session_key', session_key);
    } else {
      console.log('Warning: no new session key has bee issued in retrieveDocuments()');
    }

    return properties;
  }

  return response;
}

/**
 * Retrieves a property by agent record.id (STRAPI ID)
 * @returns property data
 */
export async function updatePublicListing(id: number, updates: { [k: string]: unknown }) {
  const response = await axios.put(`/api/agents/inventory/${id}`, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const { session_key, properties } = response.data;

    if (session_key) {
      Cookies.set('session_key', session_key);
    } else {
      console.log('Warning: no new session key has been issued in updatePublicListing()');
    }

    return properties;
  }

  return response;
}

/**
 * Retrieves a property by mls_id
 * @returns property data
 */
export async function getHistory(address: string, postal_zip_code: string) {
  const response = await axios.post(
    '/api/properties/get-history',
    { address, postal_zip_code },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const { records } = response.data || { records: [] };
  return records;
}

export async function sendInfoRequest(info: {
  customer_name: string;
  phone: string;
  message: string;
  property_address: string;
  property_photo: string;
  property_subarea_community: string;
  property_price: string;
  property_bedrooms: number;
  property_baths: number;
  property_space: number;
  send_to: {
    email: string;
    name: string;
  };
}) {
  const response = await axios.post('/api/properties/request-info', info, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}
