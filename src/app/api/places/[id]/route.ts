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
    const { formatted_address, geometry, address_components } = results.data?.result;

    if (formatted_address) {
      const components = formatted_address.split(', ');
      const address_city_state = address_components as { types: string[]; short_name: string }[];
      let city, state_province, postal_zip_code, neighbourhood;

      address_city_state.forEach(({ types, short_name }) => {
        if (types.includes('locality') && types.includes('political')) {
          city = short_name;
        }
        if (types.includes('administrative_area_level_1') && types.includes('political')) {
          state_province = short_name;
        }
        if (types.includes('postal_code')) {
          postal_zip_code = short_name;
        }
        if (types.includes('neighborhood')) {
          neighbourhood = short_name;
        }
      });

      components.pop();
      return getResponse({
        address: components.join(', '),
        lat: geometry?.location.lat,
        lon: geometry?.location.lng,
        city,
        postal_zip_code,
        state_province,
        neighbourhood,
        place_id,
      });
    }
  }
  return getResponse({ error: 'Please provide valid place_id' }, 400);
}
