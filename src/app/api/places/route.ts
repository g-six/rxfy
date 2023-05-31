import { NextRequest } from 'next/server';
import { Client, PlaceQueryAutocompletePrediction, PlaceQueryAutocompleteRequest, StructuredFormatting } from '@googlemaps/google-maps-services-js';
import { getResponse } from '@/app/api/response-helper';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query');

  const client = new Client({});
  if (!query || query.length < 3)
    return getResponse(
      {
        error: 'Please provide a search string',
      },
      400,
    );

  const place_request: PlaceQueryAutocompleteRequest = {
    params: {
      input: query,
      key: `${process.env.NEXT_APP_GGL_API_KEY}`,
    },
  };
  const results = await client.placeQueryAutocomplete(place_request);
  const suggestions =
    results.data?.predictions.map((prediction: PlaceQueryAutocompletePrediction) => {
      if (prediction.structured_formatting) {
        const { main_text, secondary_text } = prediction.structured_formatting as unknown as StructuredFormatting;
        return {
          suggestion: [main_text, secondary_text].join(', '),
          place_id: prediction.place_id,
        };
      }
    }) || [];
  return getResponse(suggestions);
}
