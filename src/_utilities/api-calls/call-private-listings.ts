import axios, { AxiosError } from 'axios';
import { PrivateListingInput, PrivateListingOutput } from '@/_typings/private-listing';
import Cookies from 'js-cookie';
import { toKebabCase } from '../string-helper';

export async function createPrivateListing(listing: PrivateListingInput) {
  try {
    const record = await axios.post('/api/private-listings', listing, {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    });
    return record.data;
  } catch (e) {
    const { response } = e as AxiosError;
    if (response && response.data) {
      return response;
    }
    return {
      error: 'Unhandled error',
      path: 'api-calls/call-private-listings',
      subroutine: 'createPrivateListing',
    };
  }
}

export async function updatePrivateListing(id: number, updates: Record<string, unknown>) {
  try {
    const record = await axios.put(`/api/private-listings/${id}`, updates, {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    });
    return record.data;
  } catch (e) {
    const { response } = e as AxiosError;
    if (response && response.data) {
      return response;
    }
    return {
      error: 'Unhandled error',
      path: 'api-calls/call-private-listings',
      subroutine: 'updatePrivateListing',
    };
  }
}

export async function getMyPrivateListings() {
  try {
    const response = await axios.get('/api/private-listings', {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (e) {
    const { response } = e as AxiosError;
    if (response && response.data) {
      return response;
    }
    return {
      error: 'Unhandled error',
      path: 'api-calls/call-private-listings',
      subroutine: 'getMyPrivateListings',
    };
  }
}

export async function getPrivateListing(id: number) {
  try {
    const record = await axios.get(`/api/private-listings/${id}`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    });
    return record.data;
  } catch (e) {
    const { response } = e as AxiosError;
    if (response && response.data) {
      return response;
    }
    return {
      error: 'Unhandled error',
      path: 'api-calls/call-private-listings',
      subroutine: 'getPrivateListing',
    };
  }
}

export async function uploadListingPhoto(file: File, index: number, listing: PrivateListingOutput) {
  return axios
    .post(
      '/api/private-listings/upload',
      { name: `${listing.id}-${toKebabCase(listing.title)}/${index.toString().padStart(3, '0')}-${file.name}`, type: file.type },
      {
        headers: {
          Authorization: `Bearer ${Cookies.get('session_key')}`,
          'Content-Type': 'application/json',
        },
      },
    )
    .then(response => {
      return {
        ...response.data,
        success: true,
      };
    });
}
