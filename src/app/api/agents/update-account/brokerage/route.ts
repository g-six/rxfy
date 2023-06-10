import { BrokerageInput } from '@/_typings/brokerage';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { createOrUpdateBrokerage } from './model';
import { AxiosError } from 'axios';

export async function PUT(req: NextRequest) {
  let response = {
    error: '',
  };
  let status = 400;
  try {
    const { token, guid } = getTokenAndGuidFromSessionKey(req.headers.get('authorization') || '');
    if (!token && isNaN(guid)) {
      response = {
        error: 'Please log in',
      };
      status;
    }

    const payload = await req.json();
    response = await createOrUpdateBrokerage(guid, payload as BrokerageInput);
    status = response.error ? 400 : 200;
  } catch (e) {
    const axerr = e as AxiosError;
    if (axerr.response?.data) console.log(JSON.stringify(axerr.response.data, null, 4));
    else console.log(e);
    response = {
      error: 'Unable to process your request',
    };
  }
  return getResponse(response, status);
}
