import axios from 'axios';
import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, MLSProperty, PropertyDataModel } from '@/_typings/property';
import { getResponse } from '../response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getNewSessionKey } from '../update-session';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { getMutationForPhotoAlbumCreation } from '@/_utilities/data-helpers/property-page';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_find_home = `query FindHomeByMLSID($mls_id: String!) {
  properties(filters:{ mls_id:{ eq: $mls_id}}, pagination: {limit:1}) {
    data {
      id
    }
  }
}`;

const gql_get_loved = `query GetLovedHomes($customer: ID!) {
  loves(filters:{ customer: { id: { eq: $customer } }}) {
    data {
      id
      attributes {
        notes
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

const gql_love = `mutation LoveHome ($property_id: ID!, $agent: ID!, $customer: ID!) {
  love: createLove(data: { property: $property_id, agent: $agent, customer: $customer }) {
    record:data {
      id
      attributes {
        property {
          data {
            id
            attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
          }
        }
        agent {
          data {
            id
            attributes {
              full_name
            }
          }
        }
        customer {
          data {
            id
            attributes {
              full_name
              last_activity_at
            }
          }
        }
      }
    }
  }
}`;

export async function GET(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  if (!token || !guid)
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  let session_key = `${token}-${guid}`;
  let message = 'Unable to retrieve saved homes';

  const love_response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_get_loved,
      variables: {
        customer: guid,
      },
    },
    {
      headers,
    },
  );

  let loves;
  if (love_response.data?.data?.loves?.data) {
    loves = love_response.data.data.loves.data;
  }
  if (loves) {
    let cover_photo = 'https://assets.website-files.com/6410ad8373b7fc352794333b/642df6a57f39e6607acedd7f_Home%20Placeholder-p-500.png';
    let photos: string[] = [];
    try {
      const records = loves.map(
        (
          love: Record<
            string,
            {
              notes?: string;
              property: {
                data: {
                  id: number;
                  attributes: PropertyDataModel;
                };
              };
            }
          >,
        ) => {
          if (!love.attributes.property.data.attributes) return undefined;
          const { property_photo_album, beds, baths, ...other_fields } = love.attributes.property.data.attributes;
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
          // FILTERS.forEach(({ keys }) => {
          //   keys.forEach(key => {
          //     const text = other_fields[key] ? (Array.isArray(other_fields[key]) ? (other_fields[key] as string[]).join(', ') : other_fields[key]) : undefined;
          //     const num = text ? Number(text) : undefined;
          //     for_filters = {
          //       ...for_filters,
          //       [key]: num || text,
          //     };
          //   });
          // });
          return {
            id: Number(love.id),
            notes: love.attributes.notes || '',
            property: {
              ...for_filters,
              ...other_fields,
              id: Number(love.attributes.property.data.id),
              beds,
              baths,
              photos,
              property_photo_album,
              cover_photo,
              area: love.attributes.property.data.attributes.area || love.attributes.property.data.attributes.city,
              mls_data: undefined, // Hide prized data
              for_filters,
            },
          };
        },
      );

      const user = await getNewSessionKey(token, guid);

      if (!user) return getResponse({ message: 'Please log in' }, 401);

      session_key = user.session_key;
      return getResponse(
        {
          session_key,
          records,
        },
        200,
      );
    } catch (e) {
      console.log('Caught error in love response');
      console.log(e);
      return getResponse({ message: 'Caught error in love response', session_key }, 400);
    }
  }

  message = `${message}\nNo valid user session`;

  return getResponse({ message }, 401);
}

export async function POST(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );

  const { agent, mls_id } = await request.json();
  let session_key = `${token}-${guid}`;

  if (agent && mls_id) {
    // First, find property
    const find_home_response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_find_home,
        variables: {
          mls_id,
        },
      },
      {
        headers,
      },
    );

    let property_id = 0;

    if (find_home_response.data?.data?.properties?.data?.length) {
      // Get Strapi ID
      property_id = find_home_response.data.data.properties.data[0].id;
    }

    if (property_id) {
      const user = await getNewSessionKey(token, guid);
      if (!user?.session_key) {
        return getResponse(
          {
            message: 'Please log in',
          },
          401,
        );
      } else {
        session_key = user.session_key;
      }

      const love_response = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_love,
          variables: {
            agent,
            customer: guid,
            property_id,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { property, ...props } = love_response.data.data.love.record.attributes;

      if (!property.data.attributes.property_photo_album?.data && property.data.attributes.mls_data?.photos?.length && property.data.id) {
        const mutation_photos = getMutationForPhotoAlbumCreation(Number(property.data.id), property.data.attributes.mls_data.photos);
        const album_response = await axios.post(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, mutation_photos, {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        });
        const {
          data: {
            data: { createPropertyPhotoAlbum },
          },
        } = album_response;
        console.log({ album_response });
        property.data.attributes.property_photo_album = createPropertyPhotoAlbum;
      }
      console.log({ property });

      return getResponse(
        {
          session_key,
          record: {
            id: Number(love_response.data.data.love.record.id),
            ...props,
            property,
          },
        },
        200,
      );
    }

    return getResponse(
      {
        session_key,
        message: 'Unable to save home',
      },
      400,
    );
  }

  return getResponse(
    {
      session_key,
      error: 'Please log in',
    },
    401,
  );
}
