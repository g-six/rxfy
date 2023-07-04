import { BathroomDetails, GQ_FRAGMENT_PROPERTY_ATTRIBUTES, MLSProperty, PropertyDataModel, RoomDetails } from '@/_typings/property';
import { RealEstateBoardDataModel } from '@/_typings/real-estate-board';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { createAgentRecordIfNoneFound } from '@/app/api/agents/model';
import { getFormattedPlaceDetails, googlePlaceQuery } from '../_helpers/geo-helper';
import axios, { AxiosError } from 'axios';
import { createCacheItem, invalidateCache } from '../_helpers/cache-helper';
import { getRealEstateBoard } from '../real-estate-boards/model';
import { bathroomsToBathroomDetails, roomsToRoomDetails } from '@/_helpers/mls-mapper';
import { GQ_FRAG_AGENT } from '../agents/graphql';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

export async function buildCacheFiles(mls_id: string) {
  try {
    const [legacy] = await retrieveFromLegacyPipeline(
      {
        from: 0,
        size: 1,
        sort: { 'data.ListingDate': 'desc' },
        query: {
          bool: {
            filter: [
              {
                match: {
                  'data.MLS_ID': mls_id,
                },
              },
            ],
            should: [],
          },
        },
      },
      undefined,
      2,
    );

    if (legacy) {
      const { mls_data, property_type, ...property } = legacy;
      const {
        ListingID: listing_id,
        LA1_FullName,
        LA2_FullName,
        LA3_FullName,
        SO1_FullName,
        SO2_FullName,
        SO3_FullName,
        LO1_Name,
        LO2_Name,
        LO3_Name,
      } = mls_data as MLSProperty;

      const listing_by_name =
        LA1_FullName || LA2_FullName || LA3_FullName || SO1_FullName || SO2_FullName || SO3_FullName || LO1_Name || LO2_Name || LO3_Name || '';
      let listing_by;
      if (listing_by_name) {
        listing_by = `Listing courtesy of ${listing_by_name}`;
      }
      const dwelling_type = {
        name: property_type,
      };
      const real_estate_board = await getRealEstateBoard(mls_data as unknown as { [key: string]: string });
      const room_details: { rooms: RoomDetails[] } = roomsToRoomDetails(mls_data as MLSProperty);
      const bathroom_details: { baths: BathroomDetails[] } = bathroomsToBathroomDetails(mls_data as MLSProperty);
      let details: { [key: string]: unknown } = {
        listing_id,
        real_estate_board,
      };
      if (isNaN(Number(legacy.lat)) && legacy.title && legacy.postal_zip_code) {
        // No lat,lon - extra processing
        const [place] = await googlePlaceQuery(`${legacy.title} ${legacy.postal_zip_code}`);
        if (place && place.place_id) {
          details = await getFormattedPlaceDetails(place.place_id);

          details = {
            ...details,
            listing_id,
          };
        }
      }
      axios.get(`${process.env.NEXT_PUBLIC_API}/strapi/property/${mls_id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const file = `listings/${mls_id}`;
      const clean = {
        ...property,
        ...details,
        room_details,
        bathroom_details,
        listing_by,
        dwelling_type,
      };
      const recent_json = JSON.stringify(clean, null, 4);

      invalidateCache([`/${file}/recent.json`, `/${file}/legacy.json`]);
      createCacheItem(recent_json, `${file}/recent.json`, 'text/json');
      return {
        ...clean,
        code: 200,
      };
    }
  } catch (e) {
    const axerr = e as AxiosError;
    if (axerr.response?.status === 403) {
      // Might not have cache yet, attempt to create
      console.log('Might not have cache yet, attempt to create');
      const xhr = await axios.get(`${process.env.NEXT_PUBLIC_API}/strapi/property/${mls_id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`From integrations: ${process.env.NEXT_PUBLIC_API}/strapi/property/${mls_id}`);
    }

    if (!axerr.response?.data) {
      console.log('[ERROR] api/properties/model.buildCacheFiles', axerr.response);
    }

    return {
      api: 'properties.mls-id.GET',
      message: axerr.message,
      code: axerr.code,
    };
  }
}

export async function getPropertyByMlsId(mls_id: string) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_mls,
        variables: {
          mls_id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const data_records = response?.data?.data?.properties?.data;
    if (data_records && Array.isArray(data_records) && data_records.length) {
      const invalidations: string[] = [];
      const records: PropertyDataModel[] = [];
      data_records
        .map(({ id: property_id, attributes }) => {
          const { mls_data, property_type, ...property } = attributes as PropertyDataModel;
          Object.keys(property).forEach(k => {
            const attrib = property as unknown as { [a: string]: unknown };
            if (attrib[k] === null) delete attrib[k];
          });
          let cover_photo = property.property_photo_album?.data?.attributes?.photos?.[0];
          cover_photo = cover_photo ? getImageSized(cover_photo, 480) : '/house-placeholder.png';
          return {
            ...property,
            amenities: (property.amenities?.data || []).map(item => ({
              ...item.attributes,
              id: Number(item.id),
            })),
            appliances: (property.appliances?.data || []).map(item => ({
              ...item.attributes,
              id: Number(item.id),
            })),
            build_features: (property.build_features?.data || []).map(item => ({
              ...item.attributes,
              id: Number(item.id),
            })),
            connected_services: (property.connected_services?.data || []).map(item => ({
              ...item.attributes,
              id: Number(item.id),
            })),
            facilities: (property.facilities?.data || []).map(item => ({
              ...item.attributes,
              id: Number(item.id),
            })),
            hvac: (property.hvac?.data || []).map(p => ({
              ...p.attributes,
              id: Number(p.id),
            })),
            parking: (property.parking?.data || []).map(p => ({
              ...p.attributes,
              id: Number(p.id),
            })),
            photos: property.property_photo_album?.data?.attributes?.photos || [],
            places_of_interest: (property.places_of_interest?.data || []).map(p => ({
              ...p.attributes,
              id: Number(p.id),
            })),
            property_photo_album: Number(property.property_photo_album?.data?.id || 0) || undefined,
            real_estate_board: property.real_estate_board?.data?.attributes ? property.real_estate_board?.data?.attributes : undefined,
            id: Number(property_id),
            cover_photo,
            dwelling_type: {
              name: property_type,
            },
          } as unknown as PropertyDataModel;
        })
        .forEach((p: PropertyDataModel) => {
          records.push(p);
          createCacheItem(JSON.stringify(p, null, 4), `listings/${p.mls_id}/recent.json`, 'text/json');
          createCacheItem(JSON.stringify(p.mls_data, null, 4), `listings/${p.mls_id}/legacy.json`, 'text/json');
          invalidations.push(`/listings/${p.mls_id}/recent.json`);
          invalidations.push(`/listings/${p.mls_id}/legacy.json`);
        });
      invalidateCache(invalidations);
      return records[0];
    }
    return [];
  } catch (e) {
    const axerr = e as AxiosError;
    console.log('Error caught: properties.model.getPropertiesFromAgentInventory');
    console.log(axerr.response?.data);
  }
}
export async function getPropertiesFromAgentInventory(agent_id: string) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_inventory_by_agent_id,
        variables: {
          agent_id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const data_records = response?.data?.data?.agentInventories?.data;
    if (data_records && Array.isArray(data_records) && data_records.length) {
      let records: {
        [status: string]: PropertyDataModel[];
      } = {};
      data_records
        .map(d => {
          const {
            agent: {
              data: { attributes: agent_attributes },
            },
            property: {
              data: { id: property_id, attributes },
            },
          } = d.attributes;
          const { mls_data, ...property } = attributes as PropertyDataModel;
          Object.keys(property).forEach(k => {
            const attrib = property as unknown as { [a: string]: unknown };
            if (attrib[k] === null) delete attrib[k];
          });
          let cover_photo = property.property_photo_album?.data?.attributes?.photos?.[0];
          cover_photo = cover_photo ? getImageSized(cover_photo, 480) : '/house-placeholder.png';
          return {
            ...property,
            amenities: (property.amenities?.data || []).map(item => ({
              ...item.attributes,
              id: Number(item.id),
            })),
            appliances: (property.appliances?.data || []).map(item => ({
              ...item.attributes,
              id: Number(item.id),
            })),
            build_features: (property.build_features?.data || []).map(item => ({
              ...item.attributes,
              id: Number(item.id),
            })),
            connected_services: (property.connected_services?.data || []).map(item => ({
              ...item.attributes,
              id: Number(item.id),
            })),
            facilities: (property.facilities?.data || []).map(item => ({
              ...item.attributes,
              id: Number(item.id),
            })),
            hvac: (property.hvac?.data || []).map(p => ({
              ...p.attributes,
              id: Number(p.id),
            })),
            parking: (property.parking?.data || []).map(p => ({
              ...p.attributes,
              id: Number(p.id),
            })),
            photos: property.property_photo_album?.data?.attributes?.photos || [],
            places_of_interest: (property.places_of_interest?.data || []).map(p => ({
              ...p.attributes,
              id: Number(p.id),
            })),
            property_photo_album: Number(property.property_photo_album?.data?.id || 0) || undefined,
            real_estate_board: property.real_estate_board?.data?.attributes ? property.real_estate_board?.data?.attributes : undefined,
            id: Number(property_id),
            listing_by: `Listing courtesy of ${agent_attributes.full_name}`,
            cover_photo,
          } as unknown as PropertyDataModel;
        })
        .forEach((p: PropertyDataModel) => {
          const status = p.status?.toLowerCase() || 'terminated';
          records = {
            ...records,
            [status]: [...(records[status] || []), p],
          };
        });

      invalidateCache([`/${agent_id}/listings.json`]);
      createCacheItem(JSON.stringify(records, null, 4), `${agent_id}/listings.json`, 'text/json');
      return records;
    }
    return response?.data?.data?.agentInventories?.data || {};
  } catch (e) {
    const axerr = e as AxiosError;
    console.log('Error caught: properties.model.getPropertiesFromAgentInventory');
    console.log(axerr.response?.data);
  }
}

const gql_inventory_by_agent_id = `query GetAgentInventory($agent_id: String!) {
	agentInventories(filters: { agent: { agent_id: { eqi: $agent_id } } }, pagination: { pageSize: 100 }) {
    data {
      id
      attributes {
        agent {
          data {
            ${GQ_FRAG_AGENT}
          }
        }
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

const gql_mls = `query GetPublicProperty($mls_id: String!) {
	properties(filters: { mls_id: { eqi: $mls_id } }) {
    data {
      id
      attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
    }
  }
}`;
