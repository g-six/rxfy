import { getMutationForPhotoAlbumCreation } from '@/_utilities/data-helpers/property-page';
import axios from 'axios';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

/**
 * Create a photo album given a property id and an array of photo urls
 * @param property_id
 * @param photos
 * @returns Promise<{ id: number, photos: string[] }>
 */
export async function createPhotoAlbumForProperty(property_id: number, photos: string[]): Promise<{ id: number; photos: string[] }> {
  console.log({
    property_id,
    photos,
  });
  const album_xhr = await axios.post(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, getMutationForPhotoAlbumCreation(property_id, photos), {
    headers,
  });
  const {
    data: {
      createPropertyPhotoAlbum: { data: photo_album },
    },
  } = album_xhr;
  const id = Number(photo_album.id);
  photos = photo_album.attributes.photos || [];
  return {
    id,
    photos,
  };
}
