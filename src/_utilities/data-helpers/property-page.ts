import { AgentData } from '@/_typings/agent';
import {
  DateFields,
  FinanceFields,
  GQ_FRAGMENT_PROPERTY_ATTRIBUTES,
  MLSProperty,
  NumericFields,
  PropertyDataModel,
  PropertyPageData,
} from '@/_typings/property';
import { AxiosError, AxiosStatic } from 'axios';
import { dateStringToDMY } from './date-helper';
import { capitalizeFirstLetter } from '../formatters';
import { MLSPropertyExtended } from '@/_typings/filters_compare';
import { getCombinedData } from './listings-helper';
import { getRealEstateBoard } from '@/app/api/real-estate-boards/model';

export const general_stats: Record<string, string> = {
  age: 'Age',
  year_built: 'Build Year',
  baths: 'Total Baths',
  beds: 'Total Bedrooms',
  L_Features: 'Features',
  B_Amenities: 'Amenities',
  land_title: 'Title to Land',
  property_type: 'Property Type',
  L_Fireplaces: '# of Fireplaces',
  L_KitchensTotal: '# of Kitchens',
  // L_Parking_total: 'Parking',
  // L_Parking_covered: 'Parking',
  parking: 'Parking Access',
  Zoning: 'Zoning',
  heating: 'Fuel/Heating',
};

export const main_stats: Record<string, string> = {
  B_Basement: 'Basement',
  L_Fireplaces: '# of Fireplaces',
  L_KitchensTotal: '# of Kitchens',
  L_TotalBaths: 'Total Baths',
  L_BedroomTotal: 'Total Bedrooms',
  L_Parking_total: 'Parking',
  L_Frontage_Feet: 'Frontage',
  L_LotSize_SqFt: 'Size Sqft',
  L_NoFloorLevels: 'Floor Levels',
};

export const building_stats: Record<string, string> = {
  L_Stories: 'Stories',
  B_Heating: 'Fuel/Heating',
  B_OutdoorArea: 'Outdoor Area',
  RainScreen: 'Rain Screen',
  B_Restrictions: 'Restrictions',
  B_Roof: 'Roof',
  L_TotalUnits: 'Tot Units in Strata Plan',
  B_TotalUnits: 'Units in Development',
  B_WaterSupply: 'Water Supply',
};

export const amenities_stats: Record<string, string> = {
  B_Amenities: 'Amenities',
  B_SiteInfluences: 'Site Influences',
  B_Bylaws: 'By Laws',
  L_Fireplace_Fuel: 'Fireplace Fuel',
  L_Floor_Finish: 'Floor Finish',
  L_Locker: 'Locker',
};

export const room_stats: Record<string, {}> = {
  Room1: { L_Room1_Type: 'Type', L_Room1_Level: 'Level', L_Room1_Dimension1: 'Dimension1', L_Room1_Dimension2: 'Dimension2' },
  Room2: { L_Room2_Type: 'Type', L_Room2_Level: 'Level', L_Room2_Dimension1: 'Dimension1', L_Room2_Dimension2: 'Dimension2' },
  Room3: { L_Room3_Type: 'Type', L_Room3_Level: 'Level', L_Room3_Dimension1: 'Dimension1', L_Room3_Dimension2: 'Dimension2' },
  Room4: { L_Room4_Type: 'Type', L_Room4_Level: 'Level', L_Room4_Dimension1: 'Dimension1', L_Room4_Dimension2: 'Dimension2' },
  Room5: { L_Room5_Type: 'Type', L_Room5_Level: 'Level', L_Room5_Dimension1: 'Dimension1', L_Room5_Dimension2: 'Dimension2' },
  Room6: { L_Room6_Type: 'Type', L_Room6_Level: 'Level', L_Room6_Dimension1: 'Dimension1', L_Room6_Dimension2: 'Dimension2' },
  Room7: { L_Room7_Type: 'Type', L_Room7_Level: 'Level', L_Room7_Dimension1: 'Dimension1', L_Room7_Dimension2: 'Dimension2' },
  Room8: { L_Room8_Type: 'Type', L_Room8_Level: 'Level', L_Room8_Dimension1: 'Dimension1', L_Room8_Dimension2: 'Dimension2' },
};

export const financial_stats: Record<string, string> = {
  L_GrossTaxes: 'Gross taxes',
  mls_id: 'MLS #',
  SoldPrice: 'Sold For',
  price_per_sqft: 'Price per Sqft',
  strata_fee: 'Strata Fee',
  ListingDate: 'List Date',
};

export const construction_stats: Record<string, string> = {
  B_Style: 'Style of Home',
  B_Construction: 'Construction',
  LFD_FloorFinish_19: 'Floor Finish',
  B_Exterior_Finish: 'Exterior Finish',
  L_Fireplace_Fuel: 'Fireplace Fueled by',
  LFD_Foundation_155: 'Foundation',
  roofing: 'Roof',
  L_ComplexName: 'Complex/Subdivision',
  L_NoFloorLevels: 'Floor Levels',
};

export const dimension_stats: Record<string, string> = {
  frontage_feet: 'Frontage',
  depth: 'Depth',
  floor_area: 'Total floor area',
  L_FloorArea_Finished_AboveMainFloor: 'Floor Area Fin - Abv Main',
  L_FloorArea_Main: 'Main Floor Area',
  floor_area_main: 'Main Floor Area',
  L_FloorArea_GrantTotal: 'Floor Area - Grant Total',
};

export const property_features: string[] = [
  'L_Features',
  'B_WaterSupply',
  'LFD_Amenities_56',
  'LFD_BylawRestrictions_58',
  'LFD_ExteriorFinish_42',
  'LFD_FeaturesIncluded_55',
  'LFD_FloorFinish_50',
  'LFD_Foundation_156',
  'LFD_FuelHeating_48',
  'LFD_MaintFeeIncludes_57',
  'LFD_OutdoorArea_47',
  'LFD_Parking_44',
  'LFD_Roof_43',
  'LFD_StyleofHome_32',
  'LFD_SiteInfluences_46',
];

export function getGqlForPropertyId(id: number) {
  return {
    query: `query getProperty($id: ID!) {
        property(id: $id) {
            data {
                id
                attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
            }
        }
    }`,
    variables: {
      id,
    },
  };
}

export function getGqlForFilteredProperties(filters: Record<string, unknown>) {
  return {
    query: `query getProperties($filters: PropertyFiltersInput!) {
          properties(filters: $filters) {
              data {
                  id
                  attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
              }
          }
      }`,
    variables: {
      filters,
    },
  };
}

export function getGqlForInsertProperty(mls_data: MLSProperty, relationships?: { real_estate_board?: number }) {
  const {
    lat,
    lng: lon,
    ListingID: guid,
    Address: title,
    MLS_ID: mls_id,
    Area: area,
    City: city,
    PropertyType: property_type,
    AskingPrice: asking_price,
    B_Roof,
  } = mls_data;

  return {
    query: `mutation createProperty($input: PropertyInput!) {
          property: createProperty(data: $input) {
              data {
                  id
                  attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
              }
          }
    }`,
    variables: {
      input: {
        ...getCombinedData({
          attributes: {
            lat,
            lon,
            title,
            mls_id,
            area,
            asking_price,
            property_type,
            city,
            mls_data,
          },
        }),
        guid,
        roofing: Array.isArray(B_Roof) ? B_Roof.join(', ') : B_Roof,
        real_estate_board: relationships?.real_estate_board || undefined,
        mls_data,
      },
    },
  };
}
export function getGqlForUpdateProperty(id: number, mls_data: MLSProperty, relationships?: { real_estate_board?: number }) {
  const {
    lat,
    lng: lon,
    ListingID: guid,
    Address: title,
    MLS_ID: mls_id,
    Area: area,
    City: city,
    PropertyType: property_type,
    AskingPrice: asking_price,
    B_Roof,
  } = mls_data;

  return {
    query: `mutation UpdateProperty($id: ID!, $input: PropertyInput!) {
          property: updateProperty(id: $id, data: $input) {
              data {
                  id
                  attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
              }
          }
    }`,
    variables: {
      id,
      input: {
        ...getCombinedData({
          attributes: {
            lat,
            lon,
            title,
            mls_id,
            area,
            asking_price,
            property_type,
            city,
            mls_data,
          },
        }),
        guid,
        roofing: Array.isArray(B_Roof) ? B_Roof.join(', ') : B_Roof,
        real_estate_board: relationships?.real_estate_board || undefined,
        mls_data,
      },
    },
  };
}

// Let's only retrieve listings from 4 hours ago as
// the Geocoding script might still be running on
// the new entries (time here is UTC due to legacy server config)
const gte = new Date(new Date().getTime() - 4 * 60 * 60000).toISOString().substring(0, 19);

export const must_not: {
  match?: { [key: string]: string };
  range?: {
    [key: string]: {
      lte?: string;
      gte?: string;
    };
  };
}[] = [
  { match: { 'data.IdxInclude': 'no' } },
  { match: { 'data.L_Class': 'Rental' } },
  { match: { 'data.L_Class': 'Commercial Lease' } },
  { match: { 'data.L_Class': 'Commercial Sale' } },
  {
    match: {
      'data.Status': 'Terminated',
    },
  },
  {
    range: {
      'data.UpdateDate': {
        gte,
      },
    },
  },
];

export async function retrieveFromLegacyPipeline(
  params: {
    from: number;
    size: number;
    sort?:
      | {
          [key: string]: 'asc' | 'desc';
        }
      | {
          [key: string]: 'asc' | 'desc' | Record<string, unknown>;
        }[];
    fields?: string[];
    query: {
      bool: {
        filter?: {
          match?: Record<string, string | number>;
          range?: {};
        }[];
        should?: {
          match?: Record<string, string | number>;
          range?: {};
        }[];
        minimum_should_match?: number;
        must_not?: {
          match?: Record<string, string | number>;
          range?: {};
        }[];
      };
    };
    _source?: boolean;
  } = {
    from: 0,
    size: 3,
    sort: { 'data.ListingDate': 'desc' },
    query: {
      bool: {
        filter: [
          {
            match: {
              'data.Status': 'Active',
            },
          },
        ],
        must_not,
        should: [],
      },
    },
    _source: true,
  },
  config = {
    url: process.env.NEXT_APP_LEGACY_PIPELINE_URL as string,
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  },
) {
  const axios: AxiosStatic = (await import('axios')).default;
  const {
    data: {
      hits: { hits },
    },
  } = await axios.post(config.url, params, {
    headers: config.headers,
  });

  return hits.map(({ _source, fields }: { _source: unknown; fields: Record<string, unknown> }) => {
    let hit: Record<string, unknown>;
    if (_source) {
      hit = (
        _source as {
          data: Record<string, unknown>;
        }
      ).data;
    } else {
      hit = fields;
    }

    let property = {
      Address: '',
      Status: '',
    };
    Object.keys(hit as Record<string, unknown>).forEach(key => {
      if (hit[key]) {
        property = {
          ...property,
          [_source ? key : key.split('.')[1]]: _source || key === 'data.photos' ? hit[key] : (hit[key] as string[] | number[]).join(','),
        };
      }
    });

    return property as MLSProperty;
  });
}

export async function getRecentListings(agent: AgentData, limit = 3) {
  const should: {
    match: {
      [key: string]: string;
    };
  }[] = [
    {
      match: { 'data.LA1_LoginName': agent.agent_id },
    },
    {
      match: {
        'data.LA2_LoginName': agent.agent_id,
      },
    },
    {
      match: {
        'data.LA3_LoginName': agent.agent_id,
      },
    },
  ];
  if (agent.metatags?.brokerage_id) {
    should.push({
      match: { 'data.ListOffice1': agent.metatags?.brokerage_id },
    });
    should.push({
      match: { 'data.ListOffice2': agent.metatags?.brokerage_id },
    });
    should.push({
      match: { 'data.ListOffice3': agent.metatags?.brokerage_id },
    });
  }
  let properties = await retrieveFromLegacyPipeline({
    from: 0,
    size: limit,
    sort: { 'data.ListingDate': 'desc' },
    query: {
      bool: {
        filter: [
          {
            match: {
              'data.Status': 'Active',
            },
          },
        ],
        should,
        minimum_should_match: 1,
        must_not,
      },
    },
  });
  if (properties.length === 0) {
    properties = await retrieveFromLegacyPipeline({
      from: 0,
      size: 3,
      sort: { 'data.ListingDate': 'desc' },
      query: {
        bool: {
          filter: agent.metatags?.target_city
            ? [
                {
                  match: {
                    'data.PropertyType': 'Residential Detached',
                  },
                },
                {
                  match: {
                    'data.Status': 'Active',
                  },
                },
              ]
            : [
                {
                  match: {
                    'data.Status': 'Active',
                  },
                },
              ],
          should: agent.metatags?.target_city
            ? [
                {
                  match: {
                    'data.L_Region': 'Greater Vancouver',
                  },
                },
              ]
            : [
                {
                  match: {
                    'data.L_Region': 'Greater Vancouver',
                  },
                },
              ],
          must_not,
        },
      },
    });
  }
  return properties;
}

async function upsertPropertyToCMS(mls_data: MLSProperty) {
  const axios: AxiosStatic = (await import('axios')).default;
  try {
    const real_estate_board_res = await getRealEstateBoard(mls_data as unknown as { [key: string]: string });
    const real_estate_board = real_estate_board_res?.id || undefined;
    const xhr = await axios.post(process.env.NEXT_APP_CMS_GRAPHQL_URL as string, getGqlForInsertProperty(mls_data, { real_estate_board }), {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Real Estate Board Data', real_estate_board_res);

    return xhr?.data?.data?.property || {};
  } catch (e) {
    const error = e as AxiosError;
    console.log('ERROR in upsertPropertyToCMS.axios', '\n', error, '\n\n');
  }
}

export async function getPrivatePropertyData(property_id: number | string) {
  const axios: AxiosStatic = (await import('axios')).default;
  const url = `${process.env.NEXT_APP_PRIVATE_LISTINGS_API}/prod-listings/_doc/${property_id}`;
  let clean: Record<string, unknown> | MLSProperty = {};
  const neighbours: MLSProperty[] = [];
  const sold_history: MLSProperty[] = [];

  const res = await axios
    .get(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_PRIVATE_LISTINGS_USER}:${process.env.NEXT_APP_PRIVATE_LISTINGS_PSWD}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })
    .catch(console.log);
  if (res && res.status === 200) {
    const { data: property } = res.data._source;

    Object.keys(property).map((key: string) => {
      if (property[key]) {
        clean = {
          ...clean,
          [key]: property[key],
        };
      }
    });

    const {
      data: {
        hits: { total, hits },
      },
    } = await axios.post(
      process.env.NEXT_APP_LEGACY_PIPELINE_URL as string,
      {
        query: {
          bool: {
            should: [
              { match: { 'data.Address': clean.Address } },
              {
                match: {
                  'data.PostalCode_Zip': clean.PostalCode_Zip,
                },
              },
              {
                match: {
                  'data.Province_State': clean.Province_State,
                },
              },
            ],
            minimum_should_match: 3,
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    hits.forEach(({ _source }: { _source: unknown }) => {
      const { data: hit } = _source as {
        data: Record<string, unknown>;
      };
      let property = {
        Address: '',
        Status: '',
      };
      Object.keys(hit as Record<string, unknown>).forEach(key => {
        if (hit[key]) {
          property = {
            ...property,
            [key]: hit[key],
          };
        }
      });
      if (property.Status === 'Sold' && property.Address === clean.Address) sold_history.push(property as MLSProperty);
      else if (property.Status === 'Active') neighbours.push(property as MLSProperty);
    });
  }

  return {
    ...(clean as MLSProperty | PropertyDataModel),
    neighbours,
    sold_history,
  };
}
export async function getPropertyData(property_id: number | string, id_is_mls = false): Promise<PropertyPageData> {
  const axios: AxiosStatic = (await import('axios')).default;

  let xhr = await axios
    .post(
      process.env.NEXT_APP_CMS_GRAPHQL_URL as string,
      id_is_mls
        ? getGqlForFilteredProperties({
            mls_id: {
              eq: property_id,
            },
          })
        : getGqlForPropertyId(property_id as number),
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    )
    .catch(e => {
      console.log('ERROR in getPropertyData.axios for id', property_id, '\n', e.message, '\n\n');
    });
  let found_in_strapi = true;
  let property = xhr?.data?.data?.property?.data || xhr?.data?.data?.properties?.data[0];

  if (id_is_mls && (property === undefined || !property)) {
    // Data was not picked up by the integrations API,
    // attempt to fix
    found_in_strapi = false;
    const [mls_data] = await retrieveFromLegacyPipeline({
      from: 0,
      size: 1,
      query: {
        bool: {
          filter: [
            {
              match: {
                'data.MLS_ID': property_id,
              },
            },
          ],
          should: [],
        },
      },
    });

    console.log('Trying to upsert a property to our CMS');
    const on_the_fly_record = await upsertPropertyToCMS(mls_data);

    console.log('DONE');
    if (on_the_fly_record?.data) {
      property = on_the_fly_record.data;
      console.log('Property ID', property.id);
    }
  } else if (!property.attributes.price_per_sqft) {
    console.log('Missing property.attributes.price_per_sqft');
    let { mls_data, ...trimmed } = property.attributes;
    trimmed = fillPropertyDataFromPipeline(mls_data);
    console.log('Additional', JSON.stringify(trimmed, null, 4));
    property = {
      ...property,
      attributes: {
        ...property.attributes,
        ...trimmed,
      },
    };
  }

  let clean: Record<string, unknown> | MLSProperty = {};
  const neighbours: MLSProperty[] = [];
  const sold_history: MLSProperty[] = [];

  let property_attributes;
  if (property?.attributes) {
    const { mls_data, ...attributes } = property.attributes;
    let { lat, lon } = attributes;
    clean = {
      ...clean,
      id: Number(property.id),
    };
    property_attributes = attributes as PropertyDataModel;

    Object.keys(mls_data).map((key: string) => {
      if (mls_data[key]) {
        if (key === 'lng' && !lon) {
          lon = Number(mls_data[key]);
        }
        if (key === 'lat' && !lat) {
          lat = Number(mls_data[key]);
        }
        clean = {
          ...clean,
          ...attributes,
          [key]: mls_data[key],
        };
      }
    });

    const {
      data: {
        hits: { hits },
      },
    } = await axios.post(
      process.env.NEXT_APP_LEGACY_PIPELINE_URL as string,
      {
        query: {
          bool: {
            should: [
              { match: { 'data.Address': clean.Address } },
              {
                match: {
                  'data.PostalCode_Zip': clean.PostalCode_Zip,
                },
              },
              {
                match: {
                  'data.Province_State': clean.Province_State,
                },
              },
            ],
            minimum_should_match: 3,
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    hits.forEach(({ _source }: { _source: unknown }) => {
      const { data: hit } = _source as {
        data: Record<string, unknown>;
      };
      let property = {
        Address: '',
        Status: '',
      };
      Object.keys(hit as Record<string, unknown>).forEach(key => {
        if (hit[key] && key !== 'id') {
          property = {
            ...property,
            [key]: hit[key],
          };
        }
      });
      if (property.Status === 'Sold' && property.Address === clean.Address) sold_history.push(property as MLSProperty);
      else if (property.Status === 'Active') neighbours.push(property as MLSProperty);
    });
  }

  if (property_attributes) console.log('getPropertyData', property_attributes.title);
  else console.log('property_attributes was null');
  console.log('Getting agent info');

  const agent_info = {
    company: [clean.LO1_Name, clean.LO2_Name, clean.LO3_Name].filter(v => !!v).join(', '),
    tel: [clean.LO1_Phone, clean.LO2_Phone, clean.LO3_Phone, clean.LA1_PhoneNumber1, clean.LA2_PhoneNumber1, clean.LA3_PhoneNumber1]
      .filter(v => !!v)
      .join(', '),
    email: [clean.LA1_Email, clean.LA2_Email, clean.LA2_Email].filter(v => !!v).join(', '),
    name: [clean.LA1_FullName, clean.LA2_FullName, clean.LA3_FullName].filter(v => !!v).join(', '),
  };

  console.log('agent_info:', agent_info);
  console.log('---');
  console.log('');

  let { photos, ...denormed } = clean as unknown as PropertyDataModel & MLSPropertyExtended;
  if (denormed.property_photo_album?.data) {
    if (typeof denormed.property_photo_album.data.attributes.photos === 'string') {
      photos = JSON.parse(denormed.property_photo_album.data.attributes.photos) as string[];
    } else {
      photos = denormed.property_photo_album.data.attributes.photos;
    }
  } else if (photos && denormed.id) {
    try {
      const {
        data: { data: photo_album_result },
      } = await axios.post(process.env.NEXT_APP_CMS_GRAPHQL_URL as string, getMutationForPhotoAlbumCreation(denormed.id, photos), {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('photo_album_result', photo_album_result);
    } catch (e) {
      const axerr = e as AxiosError;
      console.log(axerr.response?.data);
    }
  } else {
    console.log('Problem with data');
    console.log(JSON.stringify(clean, null, 4));
  }

  const to_cache = {
    ...denormed,
    photos,
    neighbours,
    sold_history,
    agent_info,
  };

  return to_cache;
}

export function getMutationForPhotoAlbumCreation(property: number, photos: string[]) {
  return {
    query: `mutation CreatePhotoAlbum($property: ID!, $photos: JSON!) {
      createPropertyPhotoAlbum(data: { property: $property, photos: $photos }) {
        data {
          id
          attributes {
            photos
          }
        }
      }
    }`,
    variables: {
      property,
      photos,
    },
  };
}

export function getMutationForNewAgentInventory(property: number, agent: number) {
  return {
    query: `mutation CreateAgentInventory($input: AgentInventoryInput!) {
      createAgentInventory(data: $input) {
        data {
          id
          attributes {
            guid
            agent {
              data {
                id
                attributes {
                  full_name
                  agent_id
                }
              }
            }
            property {
              data {
                id
                attributes {
                  title
                  mls_id
                }
              }
            }
          }
        }
      }
    }`,
    variables: {
      input: {
        guid: `l${property}-a${agent}`,
        property,
        agent,
      },
    },
  };
}

export function formatValues(obj: MLSProperty | Record<string, string>, key: string): string {
  if (!obj || !obj[key]) return '';

  if (NumericFields.includes(key)) {
    return new Intl.NumberFormat(undefined).format(parseInt((obj as Record<string, string>)[key], 10) as number);
  }

  if (FinanceFields.includes(key) && !isNaN(Number(obj[key]))) {
    return `$${new Intl.NumberFormat(undefined).format(obj[key] as number)}`;
  }

  if (DateFields.includes(key)) {
    return dateStringToDMY(obj[key] as string);
  }

  if (key.toLocaleLowerCase() === 'address') {
    return capitalizeFirstLetter((obj[key] as string).toLowerCase());
  }
  return obj[key] as unknown as string;
}

export function combineAndFormatValues(values: Record<string, number | string>, left = 'L_GrossTaxes', right = 'ForTaxYear'): string {
  // Last year taxes
  if (Object.keys(values).includes(left) && Object.keys(values).includes(right)) {
    return `${formatValues(values as MLSProperty, left)} (${values.ForTaxYear})`;
  }
  return Object.keys(values)
    .map(key => values[key])
    .join(' ');
}

export function fillPropertyDataFromPipeline(mls_data: MLSProperty): PropertyDataModel {
  let lot_sqm = Number(mls_data.L_LotSize_SqMtrs);
  if (isNaN(lot_sqm)) {
    lot_sqm = 0;
  }

  const tax_year = Number(mls_data.ForTaxYear);
  const gross_taxes = Number(mls_data.L_GrossTaxes);
  const price_per_sqft = Number(mls_data.PricePerSQFT);
  const land_title = mls_data.LandTitle;

  const filled: PropertyDataModel = {
    title: mls_data.Address,
    area: mls_data.Area || mls_data.City,
    city: mls_data.City,
    asking_price: Number(mls_data.AskingPrice),
    mls_id: mls_data.MLS_ID,
    property_type: mls_data.PropertyType,
    gross_taxes: isNaN(gross_taxes) ? undefined : gross_taxes,
    tax_year: isNaN(tax_year) ? undefined : tax_year,
    lot_sqm,
    land_title,
    price_per_sqft: isNaN(price_per_sqft) ? undefined : price_per_sqft,
  };
  return filled;
}

export function slugifyAddressRecord(address: string, record_id: number) {
  return slugifyAddress(address) + `-${record_id}`;
}

export function slugifyAddress(address: string) {
  return address
    .split(',')
    .map(s => s.trim())
    .join(' ')
    .replace(/[^\w\s]/gi, '.')
    .split(' . ')
    .join(' ')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();
}
