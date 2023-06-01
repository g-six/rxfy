import { NextRequest } from 'next/server';
import { getResponse } from '@/app/api/response-helper';
import { getFormattedPlaceDetails } from '../../_helpers/geo-helper';

export async function GET(req: NextRequest) {
  const place_id = req.nextUrl.pathname.split('/').pop();

  if (place_id) {
    const place = await getFormattedPlaceDetails(place_id);

    return getResponse(place);
  }
  return getResponse({ error: 'Please provide valid place_id' }, 400);
}
