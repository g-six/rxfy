import { NextRequest } from 'next/server';
import { createPrivateListing, getPrivateListingsByRealtorId } from './model';
import { getResponse } from '../response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { PrivateListingInput } from '@/_typings/private-listing';

export async function GET(req: NextRequest) {
  const { token, guid } = getTokenAndGuidFromSessionKey(req.headers.get('authorization') || '');
  const { searchParams } = new URL(req.url);

  const from = Number(searchParams.get('from') || '0');
  const size = Number(searchParams.get('limit') || '25');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  // We'll handle photos after creation of the listing
  try {
    const records = await getPrivateListingsByRealtorId(Number(guid), size, from);

    return getResponse({ records });
  } catch (e) {
    console.log('Error in private-listings.POST');
    console.error(e);
  }
}

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
    const {
      area,
      title,
      beds,
      baths,
      building_unit,
      city,
      lat,
      lon,
      place_id,
      neighbourhood,
      postal_zip_code,
      state_province,
      dwelling_type,
      description,
      status,
    }: PrivateListingInput = await req.json();
    const record = await createPrivateListing(
      {
        area,
        title,
        building_unit,
        place_id,
        description,
        beds: beds || 0,
        baths: baths || 0,
        lat,
        lon,
        city,
        neighbourhood,
        postal_zip_code,
        state_province,
        dwelling_type,
        status: status || 'draft',
      },
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
