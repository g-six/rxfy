import { NextRequest } from 'next/server';
import { getResponse } from '@/app/api/response-helper';
import { googlePlaceQuery } from '../_helpers/geo-helper';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query');

  if (!query || query.length < 3)
    return getResponse(
      {
        error: 'Please provide a search string',
      },
      400,
    );

  const suggestions = await googlePlaceQuery(query);

  return getResponse(suggestions);
}
