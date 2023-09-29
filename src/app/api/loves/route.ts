import axios from 'axios';
import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES } from '@/_typings/property';
import { getResponse } from '../response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getNewSessionKey } from '../update-session';
import { getMutationForPhotoAlbumCreation } from '@/_utilities/data-helpers/property-page';
import { POST as getPipelineListings } from '@/app/api/pipeline/route';
import { getLovedHomes, regenerateRecords } from './model';
import { NextRequest } from 'next/server';
import { buildCacheFiles } from '../properties/model';
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
  const start = new Date().getTime();
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

  let records = [];
  const cache_url = `https://${process.env.NEXT_APP_S3_PAGES_BUCKET}/cache/${guid}/loves.json`;
  const user = await getNewSessionKey(token, guid);
  console.log(Date.now() - start, 'session');

  if (!user) return getResponse({ message: 'Please log in' }, 401);
  session_key = user.session_key;

  try {
    const results = await axios.get(cache_url);
    console.log(Date.now() - start, 's3 cache');
    regenerateRecords(guid);
    if (results.data) {
      records = results.data.records;
    }
  } catch (e) {
    records = await regenerateRecords(guid);
    console.log('\nNo cache', cache_url);
  }
  console.log(Date.now() - start, 'query');

  return getResponse(
    {
      session_key,
      records,
    },
    200,
    'application/json',
  );
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
    } else {
      const property = await buildCacheFiles(mls_id);
      console.log(JSON.stringify(property, null, 4));
    }

    if (property_id) {
      const [existing] = await getLovedHomes(guid, property_id);
      if (existing) {
        return getResponse(
          {
            session_key,
            existing,
            error: 'Existing record',
          },
          400,
        );
      }
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
        property.data.attributes.property_photo_album = createPropertyPhotoAlbum;
      }

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
