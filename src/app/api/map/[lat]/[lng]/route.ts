import { NextRequest } from 'next/server';
import { getResponse } from '@/app/api/response-helper';
import { getMapboxApiData } from '../../model';

export async function GET(req: NextRequest, { params, searchParams }: { params: { [k: string]: string }; searchParams: { [k: string]: string } }) {
  if (params.lat && params.lng) {
    const map = await getMapboxApiData(params.lat, params.lng, searchParams.q);

    return getResponse(map.data);
  }
  return getResponse({ error: 'Please provide valid lat lng' }, 400);
}
