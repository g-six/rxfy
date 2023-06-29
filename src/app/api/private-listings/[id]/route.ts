import { NextRequest } from 'next/server';
import { getPrivateListing, updatePrivateListing, updatePrivateListingAlbum } from '@/app/api/private-listings/model';
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
    let { photos, property_photo_album, ...listing } = updates;
    if (photos && photos.length) {
      const updated_album = await updatePrivateListingAlbum(photos, property_photo_album);
      if (updated_album?.id) {
        listing = {
          ...listing,
          property_photo_album: updated_album.id,
        } as unknown as PrivateListingInput;
      }
    }
    const record = await updatePrivateListing(Number(new URL(req.url).pathname.split('/').pop()), listing, token, Number(guid));
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

export async function GET(req: NextRequest) {
  const { token, guid } = getTokenAndGuidFromSessionKey(req.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  try {
    const record = await getPrivateListing(Number(new URL(req.url).pathname.split('/').pop()));
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
