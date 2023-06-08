import { NextRequest } from 'next/server';
import { updatePrivateListing } from '@/app/api/private-listings/model';
import { getResponse } from '@/app/api/response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { PrivateListingInput } from '@/_typings/private-listing';

export async function PUT(req: NextRequest) {
  const { token, guid } = getTokenAndGuidFromSessionKey(req.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  try {
    const updates: PrivateListingInput = await req.json();
    const record = await updatePrivateListing(Number(new URL(req.url).pathname.split('/').pop()), updates, token, Number(guid));
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
