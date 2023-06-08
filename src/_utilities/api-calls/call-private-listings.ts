import axios, { AxiosError } from 'axios';
import { PrivateListingInput } from '@/_typings/private-listing';
import Cookies from 'js-cookie';
import { getResponse } from '@/app/api/response-helper';

export async function uploadListingPhoto(file: File) {
  return axios
    .post(
      '/api/private-listings/upload',
      { name: file.name, type: file.type },
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
      // setFile(undefined);
      // fireEvent({
      //   category: NotificationCategory.SUCCESS,
      //   message: NotificationMessages.DOC_UPLOAD_COMPLETE,
      //   timeout: 5000,
      // });
    });
}
export async function createPrivateListing(listing: PrivateListingInput) {
  try {
    const record = await axios.post('/api/private-listings', listing, {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    });
    return getResponse(record.data);
  } catch (e) {
    const { response } = e as AxiosError;
    if (response && response.data) {
      return getResponse(response.data, response.status);
    }
    return getResponse(
      {
        error: 'Unhandled error',
        path: 'api-calls/call-private-listings',
        subroutine: 'createPrivateListing',
      },
      400,
    );
  }
}
