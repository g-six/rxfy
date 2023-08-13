import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, PROPERTY_ASSOCIATION_KEYS, PropertyDataModel } from '@/_typings/property';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import axios from 'axios';
import { createCacheItem } from '../_helpers/cache-helper';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const gql_get_loved = `query GetLovedProperty($filters: LoveFiltersInput!, $pagination: PaginationArg!) {
    loves(filters: $filters, pagination: $pagination, sort: "createdAt:desc") {
        data {
            id
            attributes {
                notes
                updated_at: updatedAt
                property {
                    data {
                        id
                        attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
                    }
                }
            }
        }
    }
  }`;

export async function getLovedHomes(customer: number, property_id?: number) {
  const love_response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_get_loved,
      variables: {
        filters: { ...(property_id ? { property: { id: { eq: property_id } } } : {}), customer: { id: { eq: customer } } },
        pagination: { pageSize: 100 },
      },
    },
    {
      headers,
    },
  );

  return (
    love_response.data.data.loves.data as {
      id: number;
      attributes: {
        notes: string;
        updated_at: Date;
        property: {
          data: {
            id: number;
            attributes: PropertyDataModel;
          };
        };
      };
    }[]
  ).map(({ id, attributes }) => {
    const {
      property: { data: property_data },
      ...love
    } = attributes;

    const relationships: {
      [key: string]: string[];
    } = {};
    PROPERTY_ASSOCIATION_KEYS.map(relationship => {
      const { [relationship]: rel } = property_data.attributes as unknown as {
        [k: string]: {
          data: {
            attributes: {
              name: string;
            };
            id: number;
          }[];
        };
      };
      if (rel?.data && Array.isArray(rel.data)) {
        try {
          relationships[relationship] = rel.data.map(r => r.attributes.name);
        } catch (e) {
          console.log('getLovedHomes error in', relationship);
        }
      }
    });

    return {
      ...love,
      id: Number(id),
      property: {
        ...property_data.attributes,
        ...relationships,
        id: Number(property_data.id),
      },
    };
  });
}

export async function regenerateRecords(guid: number) {
  let updated_at = 0;
  const loves = await getLovedHomes(guid);

  if (loves) {
    const records = loves.map(love => {
      if (!love.property) return undefined;
      let cover_photo = 'https://assets.website-files.com/6410ad8373b7fc352794333b/642df6a57f39e6607acedd7f_Home%20Placeholder-p-500.png';
      let photos: string[] = [];
      const { property_photo_album, beds, baths, ...other_fields } = love.property;
      if (property_photo_album?.data) {
        const {
          attributes: { photos: property_photos },
        } = property_photo_album.data as unknown as {
          attributes: {
            photos: string[];
          };
        };

        photos = property_photos.map((src: string, idx) => {
          if (idx === 0) cover_photo = getImageSized(src, 520);
          return getImageSized(src, 1400);
        });
      }

      let for_filters = {};
      const ts = new Date(love.updated_at).getTime();
      if (updated_at < ts) updated_at = ts;

      return {
        id: Number(love.id),
        notes: love.notes || '',
        updated_at: new Date(love.updated_at),
        property: {
          ...for_filters,
          ...other_fields,
          id: Number(other_fields.id),
          beds,
          baths,
          photos,
          property_photo_album,
          cover_photo,
          area: other_fields.area || other_fields.city,
          mls_data: undefined, // Hide prized data
          for_filters,
        },
      };
    });

    if (updated_at) {
      const timestamp = new Date(updated_at).toISOString();
      createCacheItem(
        JSON.stringify(
          {
            records,
            timestamp,
          },
          null,
          4,
        ),
        `cache/${guid}/loves.json`,
      );
    }

    return records;
  }

  return [];
}
