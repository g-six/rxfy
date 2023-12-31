import {
  BathroomDetails,
  GQL_MARK_SOLD,
  GQ_FRAGMENT_PROPERTY_ATTRIBUTES,
  MLSProperty,
  PropertyDataModel,
  PropertyInput,
  RoomDetails,
  SoldPropertyInput,
} from '@/_typings/property';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { getFormattedPlaceDetails, googlePlaceQuery } from '../_helpers/geo-helper';
import axios, { AxiosError } from 'axios';
import { createCacheItem, invalidateCache } from '../_helpers/cache-helper';
import { bathroomsToBathroomDetails, roomsToRoomDetails } from '@/_helpers/mls-mapper';
import { getPropertyAttributes } from '@/app/api/property-attributes/model';
import { GQ_FRAG_AGENT } from '@/app/api/agents/graphql';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { formatAddress } from '@/_utilities/string-helper';
import { formatValues, getGqlForInsertProperty } from '@/_utilities/data-helpers/property-page';
import { createPhotoAlbumForProperty } from '../property-photo-albums/model';
import { getRealEstateBoard } from '../real-estate-boards/model';
import {
  getAssociatedAmenities,
  getAssociatedAppliances,
  getAssociatedBuildFeatures,
  getAssociatedConnectedServices,
  getAssociatedFacilities,
  getAssociatedHvac,
  getAssociatedParking,
  getAssociatedPlacesOfInterests,
} from './helpers';
import { BuildingUnit, PropertyAttributes } from './types';
import { createAgent, findAgentBy, updateAgentMetatags } from '../agents/model';
import { consoler } from '@/_helpers/consoler';
import { updatePublicListing } from '../agents/inventory/model';

const FILE = 'api/properties/model.ts';

export interface MapboxResultProperties {
  name: string;
  mapbox_id: string;
  address: string;
  full_address: string;
  context: {
    country: {
      id: string;
      name: string;
      country_code: string;
      country_code_alpha_3: string;
    };
    region: {
      id: string;
      name: string;
      region_code: string;
      region_code_full: string;
    };
    postcode: {
      id: string;
      name: string;
    };
    district: {
      id: string;
      name: string;
    };
    place: {
      id: string;
      name: string;
    };
    locality: {
      id: string;
      name: string;
    };
    neighborhood: {
      id: string;
      name: string;
    };
    address: {
      id: string;
      name: string;
      address_number: string;
      street_name: string;
    };
    street: {
      id: string;
      name: string;
    };
  };
}
export async function buildCacheFiles(mls_id: string): Promise<
  | (PropertyDataModel & {
      code: number;
      room_details: { rooms: RoomDetails[] };
      bathroom_details: { baths: BathroomDetails[] };
      listing_by: string;
      dwelling_type: { name?: string };
      real_estate_board_name: string;
      formatted_address: string;
      sqft: string;
    })
  | undefined
> {
  let start = Date.now();
  try {
    const promises = await Promise.all([
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
      ),
      getPropertyByMlsId(mls_id),
    ]);
    const [legacy] = promises[0];
    if (legacy) {
      const { mls_data, property_type, ...property } = legacy;

      // Extract information of real estate agents
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
        LA1_PhoneNumber1,
        LA2_PhoneNumber1,
        LA3_PhoneNumber1,
        LA1_Email,
        LA2_Email,
        LA3_Email,
        L_ShortRegionCode,
        ...legacy_data
      } = mls_data as MLSProperty;

      const agents: {
        agent_id: string;
        email: string;
        phone: string;
        full_name: string;
      }[] = [];
      if (legacy_data.LA1_LoginName)
        agents.push({
          agent_id: legacy_data.LA1_LoginName,
          email: LA1_Email,
          phone: LA1_PhoneNumber1,
          full_name: LA1_FullName,
        });
      if (legacy_data.LA2_LoginName)
        agents.push({
          agent_id: legacy_data.LA2_LoginName,
          email: LA2_Email || '',
          phone: LA2_PhoneNumber1 || '',
          full_name: LA2_FullName || '',
        });
      if (legacy_data.LA3_LoginName)
        agents.push({
          agent_id: legacy_data.LA3_LoginName,
          email: LA3_Email || '',
          phone: LA3_PhoneNumber1 || '',
          full_name: LA3_FullName || '',
        });

      let real_estate_board = await getRealEstateBoard(mls_data as unknown as { [key: string]: string });

      const listing_by_name =
        LA1_FullName || LA2_FullName || LA3_FullName || SO1_FullName || SO2_FullName || SO3_FullName || LO1_Name || LO2_Name || LO3_Name || '';
      let listing_by = '';
      if (listing_by_name) {
        listing_by = `Listing courtesy of ${listing_by_name}`;
      }
      const dwelling_type = {
        name: property_type,
      };
      consoler(FILE, 'Legacy pipeline data retrieved in', Date.now() - start, 'ms');
      real_estate_board = real_estate_board || undefined;
      const room_details: { rooms: RoomDetails[] } = roomsToRoomDetails(legacy_data as MLSProperty);
      const bathroom_details: { baths: BathroomDetails[] } = bathroomsToBathroomDetails(legacy_data as MLSProperty);
      let details: { [key: string]: unknown } = {
        listing_id,
        real_estate_board,
      };
      if (isNaN(Number(legacy.lat)) && legacy.title && legacy.postal_zip_code) {
        // No lat,lon - extra processing
        const [place] = await googlePlaceQuery(`${legacy.title} ${legacy.postal_zip_code}`);
        consoler(FILE, 'Google place query in', Date.now() - start, 'ms');
        if (place && place.place_id) {
          details = await getFormattedPlaceDetails(place.place_id);

          details = {
            ...details,
            listing_id,
          };
        }
      }

      const {
        L_ShortRegionCode: real_estate_board_name,
        photos: mls_photos,
        ...simple
      } = property as unknown as PropertyDataModel & {
        L_ShortRegionCode: string;
        listing_by: string;
      };

      const clean = {
        ...simple,
        ...details,
        room_details,
        bathroom_details,
        listing_by,
        real_estate_board_name,
        property_type,
      };

      let photos: string[] = [],
        property_photo_album: number = 0;

      let strapi_record: PropertyDataModel = {} as unknown as PropertyDataModel;
      if (!promises[1] && mls_data) {
        strapi_record = {} as unknown as PropertyDataModel;
        const created = await createProperty(mls_data);
        if (created) strapi_record = created;
      } else if (promises[1]) strapi_record = promises[1];

      if (strapi_record.photos?.length) {
        photos = strapi_record.photos;
      } else if (strapi_record.id && mls_photos?.length) {
        const album = await createPhotoAlbumForProperty(strapi_record.id, mls_photos);
        photos = album.photos;
        property_photo_album = album.id;
      }

      if (strapi_record?.id && agents.length) {
        await Promise.all(
          agents.map(async agent => {
            const response = await findAgentBy({ agent_id: agent.agent_id });
            if (!response)
              return await createAgent(
                {
                  ...agent,
                  real_estate_board_id: real_estate_board?.id || undefined,
                },
                undefined,
                strapi_record.id,
              );
            if (response.metatags?.id && !response.metatags?.geocoding && simple.lat && simple.lon) {
              return await updateAgentMetatags(response.metatags.id, {
                geocoding: JSON.stringify(
                  {
                    title: simple.city,
                    name: simple.city,
                    lat: simple.lat,
                    lng: simple.lon,
                    zoom: 11,
                    nelat: simple.lat + 0.001,
                    nelng: simple.lon + 0.0015,
                    swlat: simple.lat - 0.001,
                    swlng: simple.lon - 0.0015,
                  },
                  null,
                  4,
                ),
              });
            }
            return {
              message: 'Skipping createAgent() as agent already exists',
              agent: JSON.stringify(response, null, 4),
            };
          }),
        ).then(() => {
          consoler(FILE, 'buildCacheFiles completed');
        });
      }

      return {
        ...clean,
        ...(promises[1] || {}),
        photos,
        dwelling_type,
        formatted_address: formatAddress(clean.title) + ', ' + clean.city + ', ' + clean.state_province + ' ' + clean.postal_zip_code,
        sqft: formatValues(clean, 'floor_area') + ' sq.ft.',
        ...(strapi_record.id ? { id: Number(strapi_record.id) } : {}),
        code: 200,
      };
    }
  } catch (e) {
    const axerr = e as AxiosError;
    if (axerr.response?.status === 403) {
      // Might not have cache yet, attempt to create
      const xhr = await axios.get(`${process.env.NEXT_PUBLIC_API}/strapi/property/${mls_id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      consoler(FILE, `From integrations: ${process.env.NEXT_PUBLIC_API}/strapi/property/${mls_id}`);
    }

    if (!axerr.response?.data) {
      consoler(FILE, '[ERROR] api/properties/model.buildCacheFiles', axerr.response);
    }

    return {
      api: 'properties.mls-id.GET',
      message: axerr.message,
      code: Number(axerr?.code || 0),
    } as any;
  }
}

export async function getPropertyByMlsId(mls_id: string, legacy_data?: { photos?: string[] }, upsert?: MLSProperty) {
  try {
    const xhr = await fetch(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, {
      body: JSON.stringify({
        query: gql_mls,
        variables: {
          mls_id,
        },
      }),
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const json = await xhr.json();
    const data_records = json?.data?.properties?.data;

    if (data_records && Array.isArray(data_records) && data_records.length) {
      const records: PropertyDataModel[] = [];
      data_records.map(async ({ id: property_id, attributes }) => {
        const { mls_data, property_type, ...property } = attributes as PropertyDataModel;
        let listing_by = '';
        let listing_by_name = '';
        if (mls_data) {
          const { LA1_FullName, LA2_FullName, LA3_FullName, SO1_FullName, SO2_FullName, SO3_FullName, LO1_Name, LO2_Name, LO3_Name } = mls_data;
          listing_by_name =
            LA1_FullName || LA2_FullName || LA3_FullName || SO1_FullName || SO2_FullName || SO3_FullName || LO1_Name || LO2_Name || LO3_Name || '';
          if (listing_by_name) {
            listing_by = `Listing courtesy of ${listing_by_name}`;
          }
        }
        Object.keys(property).forEach(k => {
          const attrib = property as unknown as { [a: string]: unknown };
          if (attrib[k] === null) delete attrib[k];
        });
        let { photos } = (property.property_photo_album?.data?.attributes || { photos: [] }) as {
          photos: string[];
        };
        let property_photo_album = Number(property.property_photo_album?.data?.id || 0);
        let cover_photo = photos[0] || '';
        if (!cover_photo && legacy_data?.photos?.length) {
          const photo_album = await createPhotoAlbumForProperty(Number(property_id), legacy_data.photos);
          property_photo_album = photo_album.id;
          photos = photo_album.photos || [];
          cover_photo = photos[0];
        }
        cover_photo = cover_photo ? getImageSized(cover_photo, 480) : '/house-placeholder.png';
        records.push({
          ...property,
          listing_by,
          listing_by_name,
          property_photo_album,
          photos,
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
          places_of_interest: (property.places_of_interest?.data || []).map(p => ({
            ...p.attributes,
            id: Number(p.id),
          })),
          real_estate_board: property.real_estate_board?.data?.attributes ? property.real_estate_board?.data?.attributes : undefined,
          id: Number(property_id),
          cover_photo,
          dwelling_type: {
            name: property_type,
          },
        } as unknown as PropertyDataModel);
      });
      return records[0];
    }

    // If records not found in properties collection and upsert record was provided in params,
    if (upsert) {
      return await createProperty(upsert);
    }
    return;
  } catch (e) {
    const axerr = e as AxiosError;
    consoler(FILE, 'Error caught: getPropertyByMlsId');
    console.error(e);
    upsert && consoler(FILE, upsert);
    consoler(FILE, axerr.response?.data);
  }
}

export async function updatePublicListingBy(filters: { [k: string]: string }, updates: { [k: string]: any }) {
  if (filters.mls_id) {
    const listing = await getPropertyByMlsId(filters.mls_id);
    if (listing?.id) {
      updatePublicListing(listing.id, updates).then(console.log).catch(console.error);
    }
  }
}

export async function getBuildingUnits(property: PropertyDataModel): Promise<BuildingUnit[]> {
  const { title, state_province, postal_zip_code } = property;
  try {
    const response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_properties,
        variables: {
          filters: {
            title: {
              endsWith: title.split(' ').slice(1).join(' '),
            },
            postal_zip_code: {
              eqi: postal_zip_code,
            },
            state_province: {
              eqi: state_province,
            },
          },
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
    return data_records
      .map((n: unknown) => {
        const { id, attributes } = n as {
          id: number;
          attributes: PropertyDataModel;
        };
        const { mls_id, title, beds, baths, asking_price, floor_area } = attributes;

        return {
          mls_id,
          title,
          beds,
          baths,
          floor_area,
          asking_price,
          id: Number(id),
        };
      })
      .filter((n: BuildingUnit) => n.id !== property.id);
  } catch (e) {
    const axerr = e as AxiosError;
    consoler(FILE, 'Error caught: properties.model.getBuildingUnits');
    consoler(FILE, axerr.response?.data);
  }
  return [];
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
    consoler(FILE, 'Error caught: getPropertiesFromAgentInventory', axerr.response?.data);
  }
}

function getFeatureAlias(feature: string, category: string = 'Appliance') {
  switch (category) {
    case 'amenities':
      if (feature.toLowerCase().includes('washer')) return 'In Suite Laundry';
      if (feature.toLowerCase().includes('central') && feature.toLowerCase().includes('air condition')) return 'Central Air Conditioning';
      if (feature.toLowerCase().includes('club') && feature.toLowerCase().includes('house')) return 'Club House';
      if (feature.toLowerCase().includes('deck') || feature.toLowerCase().includes('dck')) return 'Deck';
      if (feature.toLowerCase().includes('washer')) return 'Washing Machine';
  }
}

async function createProperty(mls_data: MLSProperty): Promise<PropertyDataModel | undefined> {
  const property_attributes = await getPropertyAttributes();
  const relationships = property_attributes as unknown as PropertyAttributes;
  const { photos } = mls_data as unknown as {
    photos?: string[];
  };
  let amenities: number[] = [],
    appliances: number[] = [],
    build_features: number[] = [],
    connected_services: number[] = [],
    facilities: number[] = [],
    hvac: number[] = [],
    places_of_interest: number[] = [],
    parking: number[] = [];
  if (relationships.amenities) {
    amenities = getAssociatedAmenities(mls_data, relationships.amenities);
  }

  if (relationships.appliances) {
    appliances = getAssociatedAppliances(mls_data, relationships.appliances);
  }
  if (relationships.build_features) {
    build_features = getAssociatedBuildFeatures(mls_data, relationships.build_features);
  }
  if (relationships.connected_services) {
    connected_services = getAssociatedConnectedServices(mls_data, relationships.connected_services);
  }

  if (relationships.facilities) {
    facilities = getAssociatedFacilities(mls_data, relationships.facilities);
  }
  if (relationships.hvac) {
    hvac = getAssociatedHvac(mls_data, relationships.hvac);
  }
  if (relationships.parking) {
    parking = getAssociatedParking(mls_data, relationships.parking);
  }
  if (relationships.places_of_interest) {
    places_of_interest = getAssociatedPlacesOfInterests(mls_data, relationships.places_of_interest);
  }

  const { id: real_estate_board } = await getRealEstateBoard(mls_data as unknown as { [k: string]: string });
  const gql = getGqlForInsertProperty(mls_data, {
    amenities,
    appliances,
    build_features,
    connected_services,
    facilities,
    parking,
    hvac,
    places_of_interest,
    real_estate_board,
  });
  const { data } = await axios.post(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, gql, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
      'Content-Type': 'application/json',
    },
  });

  if (data?.data) {
    const {
      property: {
        data: { id: property_id, attributes },
      },
    } = data.data as {
      property: {
        data: {
          id: string;
          attributes: PropertyInput;
        };
      };
    };
    let record = {
      ...attributes,
      id: Number(property_id),
      mls_data: undefined,
    };
    if (record?.id) {
      if (mls_data.SoldPrice) {
        const sold: SoldPropertyInput = {
          sold_at_price: Number(mls_data.SoldPrice),
          date_sold: `${mls_data.ClosingDate || ''}`.split('T').reverse().pop() || '',
          mls_id: record.mls_id,
          property: record.id,
        };

        const { data: sold_response } = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: GQL_MARK_SOLD,
            variables: {
              input: sold,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (sold_response?.data) {
          consoler(FILE, { sold_response });
        }
      }

      if (photos?.length) {
        const { id: album_id, photos: album_photos } = await createPhotoAlbumForProperty(record.id, photos);
        return {
          ...record,
          property_photo_album: Number(album_id),
          photos: album_photos,
        } as unknown as PropertyDataModel;
      }

      return record as unknown as PropertyDataModel;
    }
  }
  return {} as PropertyDataModel;
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

const gql_properties = `query GetPublicProperties($filters: PropertyFiltersInput!) {
	properties(filters: $filters) {
    data {
      id
      attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
    }
  }
}`;

export const mutate_public_listing = `mutation UpdateProperty($id: ID!, $updates: PropertyInput!) {
  property: updateProperty(id: $id, data: $updates) {
    record: data {
      id
      attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
    }
  }
}`;
