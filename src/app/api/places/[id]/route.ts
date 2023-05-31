import { NextRequest } from 'next/server';
import { Client, PlaceDetailsRequest } from '@googlemaps/google-maps-services-js';
import { getResponse } from '@/app/api/response-helper';

export async function GET(req: NextRequest) {
  const place_id = req.nextUrl.pathname.split('/').pop();
  const client = new Client({});

  if (place_id) {
    const place_request: PlaceDetailsRequest = {
      params: {
        place_id,
        key: `${process.env.NEXT_APP_GGL_API_KEY}`,
      },
    };
    const results = await client.placeDetails(place_request);
    const { formatted_address, geometry } = results.data?.result;

    if (formatted_address) {
      const components = formatted_address.split(', ');
      components.pop();
      return getResponse({
        address: components.join(', '),
        lat: geometry?.location.lat,
        lon: geometry?.location.lng,
        place_id,
      });
    }
  }
  return getResponse({ error: 'Please provide valid place_id' }, 400);
}
