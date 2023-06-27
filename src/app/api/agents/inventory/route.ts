import axios, { AxiosError } from 'axios';
import { gql_agent_inventory } from '../graphql';
import { PropertyDataModel } from '@/_typings/property';
import { NextRequest } from 'next/server';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../../response-helper';
import { getNewSessionKey } from '../../update-session';
import { findAgentRecordByRealtorId } from '../model';
import { encrypt } from '@/_utilities/encryption-helper';

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
      inventory_response.data?.inventory?.records.map(({ id, attributes }: { id: number; attributes: Record<string, unknown> }) => {
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
            if (relationship?.data && Array.isArray(relationship.data)) {
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
                //   if (r.id)
              });
            }
          });
          amenities?.data?.forEach(r => r.id);
          properties.push({
            ...property,
            ...relationships,
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