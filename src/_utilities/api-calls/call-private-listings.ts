import Cookies from 'js-cookie';
import axios, { AxiosError } from 'axios';
import { PrivateListingData } from '@/_typings/events';
import { PrivateListingOutput } from '@/_typings/private-listing';
import { convertPrivateListingToPropertyData } from '@/_helpers/mls-mapper';
import { toKebabCase } from '../string-helper';

export async function createPrivateListing(listing: Record<string, unknown>) {
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

export function createOrUpdate(data: PrivateListingData, callback: (data: any) => void) {
  if (!!data.title) {
    if (!data.id) {
      createPrivateListing(convertPrivateListingToPropertyData(data))
        .then(record => record.data)
        .then((rec: PrivateListingOutput) => {
          console.log('rec', rec);
          if (data.photos && rec.id) {
            let count = 0;
            if (data && data.upload_queue?.count) {
              count = data.upload_queue.count as number;
            }
            data?.photos?.map((photo: File, cnt: number) => {
              uploadListingPhoto(photo, cnt + 1, rec).then((upload_item: { success: boolean; upload_url: string; file_path: string }) => {
                axios.put(upload_item.upload_url, photo, { headers: { 'Content-Type': photo.type } }).then(() => {
                  count++;
                  if (data.photos && data.photos[cnt]) {
                    data.photos[cnt].url = 'https://' + new URL(upload_item.upload_url).pathname.substring(1);
                  }
                });
              });
            });
          }
        })
        .then(res => callback(res));
    } else {
      updatePrivateListing(data.id, convertPrivateListingToPropertyData(data))
        .then(record => record.data)
        .then(res => callback(res));
    }
  }
}
