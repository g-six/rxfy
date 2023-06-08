import { NextRequest } from 'next/server';
import { createPrivateListing } from './model';
import { getResponse } from '../response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { PrivateListingInput } from '@/_typings/private-listing';
import { toKebabCase } from '@/_utilities/string-helper';

export async function POST(req: NextRequest) {
  const { token, guid } = getTokenAndGuidFromSessionKey(req.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  // We'll handle photos after creation of the listing
  try {
    const { area, title, beds, baths, lat, lon, city, neighbourhood, postal_zip_code, state_province, dwelling_type }: PrivateListingInput = await req.json();
    const record = await createPrivateListing(
      { area, title, beds, baths, lat, lon, city, neighbourhood, postal_zip_code, state_province, dwelling_type },
      token,
      Number(guid),
    );
    if (record.error) {
      const { error, errors, code } = record;
      return getResponse(
        {
          error,
          errors,
        },
        code || 400,
      );
    }
    return getResponse(record);
  } catch (e) {
    console.log('Error in private-listings.POST');
    console.error(e);
  }
}
