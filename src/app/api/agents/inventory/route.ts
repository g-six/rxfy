import axios, { AxiosError } from 'axios';
import { gql_agent_inventory } from '../graphql';
import { PropertyDataModel } from '@/_typings/property';
import { NextRequest } from 'next/server';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../../response-helper';
import { findAgentRecordByRealtorId } from '../model';
import { encrypt } from '@/_utilities/encryption-helper';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { updatePublicListing } from './model';

export async function GET(request: NextRequest) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );

  //   const session_data = await getNewSessionKey(token, guid, 'realtor', false);
  //   console.log(JSON.stringify(session_data, null, 4));
  const realtor = await findAgentRecordByRealtorId(guid);
  const session_key = `${encrypt(realtor.last_activity_at)}.${encrypt(realtor.email)}`;

  if (session_key !== token)
    return getResponse(
      {
        error: 'Session has expired or is invalid. Please log in',
      },
      401,
    );

  if (!realtor.agent)
    return getResponse(
      {
        error: 'Session does not represent a valid realtor. Please log in',
      },
      401,
    );

  try {
    const { data: inventory_response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_agent_inventory,
        variables: {
          agent: realtor.agent,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const properties: Record<string, unknown>[] = [];
    if (inventory_response.data?.inventory?.records) {
      await inventory_response.data?.inventory?.records.map(async ({ id, attributes }: { id: number; attributes: Record<string, unknown> }) => {
        const record = attributes.property as { data: { id: number; attributes: PropertyDataModel } };
        if (record.data.attributes) {
          const {
            amenities,
            appliances,
            build_features,
            connected_services,
            facilities,
            hvac,
            parking,
            places_of_interest,
            real_estate_board,
            property_photo_album,
            mls_data,
            ...property
          } = record.data.attributes;

          if (property.status && property.status === 'Active') {
            retrieveFromLegacyPipeline(
              {
                from: 0,
                size: 1,
                sort: { 'data.ListingDate': 'desc' },
                query: {
                  bool: {
                    filter: [
                      {
                        match: {
                          'data.MLS_ID': property.mls_id,
                        },
                      },
                    ],
                    should: [],
                  },
                },
              },
              undefined,
              2,
            ).then(mls_listings => {
              if (mls_listings.length) {
                const { mls_data: mls_listing_info } = mls_listings[0];
                if (mls_listing_info?.Status !== property.status) {
                  updatePublicListing(record.data.id, { status: mls_listing_info?.Status });
                }
              }
            });
          }

          let relationships: {
            [key: string]: {
              [key: string]: string | number;
            }[];
          } = {};
          const index =
            'amenities, appliances, build_features, connected_services, facilities, hvac, parking, places_of_interest, real_estate_board, property_photo_album'.split(
              ', ',
            );
          [
            amenities,
            appliances,
            build_features,
            connected_services,
            facilities,
            hvac,
            parking,
            places_of_interest,
            real_estate_board,
            property_photo_album,
          ].forEach((relationship, idx) => {
            if (relationship?.data) {
              if (Array.isArray(relationship.data)) {
                relationship.data.forEach(r => {
                  if (r.id) {
                    const rid = Number(r.id);
                    if (!isNaN(rid)) {
                      relationships = {
                        ...relationships,
                        [index[idx]]: relationships[index[idx]]
                          ? [
                              ...relationships[index[idx]],
                              {
                                ...r.attributes,
                                id: rid,
                              },
                            ]
                          : [
                              {
                                ...r.attributes,
                                id: rid,
                              },
                            ],
                      };
                    }
                  }
                });
              }
            }
          });
          amenities?.data?.forEach(r => r.id);
          let album = 0;
          let cover_photo = '/house-placeholder.png';
          if (property_photo_album?.data?.id) {
            album = Number(property_photo_album.data.id);
            cover_photo = property_photo_album?.data?.attributes?.photos?.[0];
            if (cover_photo) cover_photo = getImageSized(cover_photo, 256);
          }

          properties.push({
            ...property,
            ...relationships,
            property_photo_album: album,
            photos: property_photo_album?.data?.attributes?.photos || [],
            cover_photo,
            id: Number(record.data.id),
          });
        }
      });
    }

    return new Response(
      JSON.stringify(
        {
          properties,
        },
        null,
        4,
      ),
      {
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (e) {
    const errors = e as AxiosError;
    console.log('API Error: documents.GET');
    console.log(errors.message);
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Please login to retrieve inventory',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 401,
    },
  );
}
