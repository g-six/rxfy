import { NextRequest } from 'next/server';
import { updatePrivateListing } from '@/app/api/private-listings/model';
import { getResponse } from '@/app/api/response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';

export async function PUT(req: NextRequest) {
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
    const record = await updatePrivateListing(
      Number(new URL(req.url).pathname.split('/').pop()),
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
