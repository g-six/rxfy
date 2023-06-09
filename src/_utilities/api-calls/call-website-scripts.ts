import { getResponse } from '@/app/api/response-helper';
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

export async function getAgentMetaWebsiteScripts(meta_id: number) {
  try {
    const record = await axios.get('/api/website-scripts/' + meta_id, {
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
        path: 'api-calls/call-website-scripts',
        subroutine: 'getAgentMetaWebsiteScripts',
      },
      400,
    );
  }
}
