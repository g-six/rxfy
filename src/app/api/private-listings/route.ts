import { NextRequest } from 'next/server';
import { createPrivateListing } from './model';
import { getResponse } from '../response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { PrivateListingInput } from '@/_typings/private-listing';

export async function POST(req: NextRequest) {
  const { token, guid } = getTokenAndGuidFromSessionKey(req.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  const payload = await req.json();
  try {
    const listing: PrivateListingInput = payload;
    createPrivateListing(listing, token, Number(guid));
  } catch (e) {
    console.log('Error in private-listings.POST');
    console.error(e);
  }
}
