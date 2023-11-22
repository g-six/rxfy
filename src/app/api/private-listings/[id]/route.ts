import { NextRequest } from 'next/server';
import { deletePrivateListing, getPrivateListing, updatePrivateListing, updatePrivateListingAlbum } from '@/app/api/private-listings/model';
import { getResponse } from '@/app/api/response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { PrivateListingInput } from '@/_typings/private-listing';
import { getNewSessionKey } from '../../update-session';
import { deleteObject } from '../../_helpers/s3-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';

export async function DELETE(req: NextRequest) {
  const { token, guid } = getTokenAndGuidFromSessionKey(req.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  try {
    // deletePrivateListing
    const id = Number(new URL(req.url).pathname.split('/').pop());
    const record = await getPrivateListing(id);
    if (record.realtor.id === guid) {
      const { session_key } = await getNewSessionKey(token, guid, 'realtor');
      if (session_key) {
        await deletePrivateListing(id);
        return getResponse({
          record,
          session_key,
        });
      } else {
        return getResponse(
          {
            error: 'Delete is not allowed',
          },
          401,
        );
      }
    }
    return getResponse(record);
  } catch (e) {
    console.log('Error in private-listings.POST');
    console.error(e);
  }
}
export async function PUT(req: NextRequest) {
  const { token, guid } = getTokenAndGuidFromSessionKey(req.headers.get('authorization') || '');
  const id = Number(new URL(req.url).pathname.split('/').pop());
  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  // Then check ownership
  const original = await getPrivateListing(id);
  if (original.realtor?.id !== guid)
    return getResponse(
      {
        error: 'You must be the owner of this private listing to be able to update it',
      },
      401,
    );
  try {
    const updates: PrivateListingInput = await req.json();
    let { photos, property_photo_album, room_details, bathroom_details, ...listing } = updates;
    if (original.photos?.length) {
      // Let's remove any photos that have been deleted
      const to_delete = original.photos.filter((url: string) => !photos || !photos.includes(url));
      await Promise.all(
        to_delete.map(async (url: string) => {
          const delete_url = url.split(`${process.env.NEXT_APP_S3_PAGES_BUCKET}`)[1].substring(1);
          return await deleteObject(delete_url);
        }),
      );
    }
    if (photos) {
      const updated_album = await updatePrivateListingAlbum(photos, property_photo_album);
      if (updated_album?.id) {
        listing = {
          property_photo_album: updated_album.id,
        } as unknown as PrivateListingInput;
      }
    }

    Object.keys(listing).map(key => {
      listing = {
        ...listing,
        [key]: formatValues(listing, key, true),
      };
    });

    const record = await updatePrivateListing(
      id,
      {
        ...listing,
        // Workaround to skip public listing logic to rooms
        ...(bathroom_details ? { bathroom_details } : {}),
        ...(room_details ? { room_details } : {}),
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
          updates,
        },
        code || 400,
      );
    }
    return getResponse(record);
  } catch (e) {
    console.log('Error in private-listings.PUT');
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
