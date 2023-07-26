import { NextRequest } from 'next/server';
import axios from 'axios';
import { getResponse } from '@/app/api/response-helper';

export async function GET(req: NextRequest, { params }: { params: { [k: string]: string } }) {
  if (params.lat && params.lng) {
    const { NEXT_APP_MAPBOX_TOKEN } = process.env;
    const map = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${params.lng},${params.lat}.json?types=address&access_token=${NEXT_APP_MAPBOX_TOKEN}`,
    );

    return getResponse(map.data);
  }
  return getResponse({ error: 'Please provide valid place_id' }, 400);
}
