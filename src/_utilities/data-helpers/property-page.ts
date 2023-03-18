import { AgentData } from '@/_typings/agent';
import {
  DateFields,
  FinanceFields,
  MLSProperty,
  NumericFields,
} from '@/_typings/property';
import { AxiosStatic } from 'axios';
import { dateStringToDMY } from './date-helper';

export const general_stats: Record<string, string> = {
  L_Age: 'Age',
  L_YearBuilt: 'Build Year',
  L_TotalBaths: 'Total Baths',
  L_BedroomTotal: 'Total Bedrooms',
  L_Features: 'Features',
  B_Amenities: 'Amenities',
  LandTitle: 'Title to Land',
  PropertyType: 'Property Type',
  L_Fireplaces: '# of Fireplaces',
  L_KitchensTotal: '# of Kitchens',
  L_Parking_total: 'Parking',
  L_Parking_covered: 'Parking',
  B_Parking_Access: 'Parking Access',
  Zoning: 'Zoning',
  B_Heating: 'Fuel/Heating',
};

export const financial_stats: Record<string, string> = {
  PricePerSQFT: 'Price Per Sqft.',
  L_GrossTaxes: 'Gross taxes',
  ListingDate: 'List Date',
  MLS_ID: 'MLS #',
  SoldPrice: 'Sold For',
};

export const construction_stats: Record<string, string> = {
  B_Style: 'Style of Home',
  B_Construction: 'Construction',
  LFD_FloorFinish_19: 'Floor Finish',
  B_Exterior_Finish: 'Exterior Finish',
  L_Fireplace_Fuel: 'Fireplace Fueled by',
  LFD_Foundation_155: 'Foundation',
  B_Roof: 'Roof',
  L_ComplexName: 'Complex/Subdivision',
  L_NoFloorLevels: 'Floor Levels',
};

export const dimension_stats: Record<string, string> = {
  L_Frontage_Feet: 'Frontage',
  B_Depth: 'Depth',
  L_FloorArea_Total: 'Total floor area',
  L_FloorArea_Finished_AboveMainFloor: 'Floor Area Fin - Abv Main',
  L_FloorArea_Main: 'Main Floor Area',
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
                attributes {
                    mls_data
                }
            }
        }
    }`,
    variables: {
      id,
    },
  };
}

export function getGqlForFilteredProperties(
  filters: Record<string, unknown>
) {
  return {
    query: `query getProperties($filters: PropertyFiltersInput!) {
          properties(filters: $filters) {
              data {
                  id
                  attributes {
                      mls_data
                  }
              }
          }
      }`,
    variables: {
      filters,
    },
  };
}

// Let's only retrieve listings from 4 hours ago as
// the Geocoding script might still be running on
// the new entries (time here is UTC due to legacy server config)
const gte = new Date(new Date().getTime() - 8 * 60 * 60000)
  .toISOString()
  .substring(0, 19);

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
      'data.Status': 'Sold',
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
    sort?: {
      [key: string]: 'asc' | 'desc';
    };
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
  } = {
    from: 0,
    size: 3,
    sort: { 'data.ListingDate': 'desc' },
    query: {
      bool: {
        filter: [],
        must_not,
      },
    },
  },
  config = {
    url: process.env.NEXT_APP_LEGACY_PIPELINE_URL as string,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`
      ).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  }
) {
  const axios: AxiosStatic = (await import('axios')).default;
  const {
    data: {
      hits: { hits },
    },
  } = await axios.post(config.url, params, {
    headers: config.headers,
  });

  return hits.map(({ _source }: { _source: unknown }) => {
    const { data: hit } = _source as {
      data: Record<string, unknown>;
    };
    let property = {
      Address: '',
      Status: '',
    };
    Object.keys(hit as Record<string, unknown>).forEach((key) => {
      if (hit[key]) {
        property = {
          ...property,
          [key]: hit[key],
        };
      }
    });

    return property as MLSProperty;
  });
}

export async function getRecentListings(
  agent: AgentData,
  limit = 3
) {
  let properties = await retrieveFromLegacyPipeline({
    from: 0,
    size: limit,
    sort: { 'data.ListingDate': 'desc' },
    query: {
      bool: {
        filter: [],
        should: [
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
        ],
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
          filter: agent.metatags?.target_city ? [] : [],
          should: agent.metatags?.target_city
            ? []
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

export async function getSimilarHomes(
  property: MLSProperty,
  limit = 3
): Promise<MLSProperty[]> {
  if (
    property.AskingPrice &&
    property.L_BedroomTotal &&
    property.PropertyType
  ) {
    const filter: {
      match?: Record<string, string | number>;
      range?: {};
    }[] = [
      {
        range: {
          'data.AskingPrice': {
            gte: property.AskingPrice * 0.85,
            lte: property.AskingPrice * 1.1,
          },
        },
      },
      {
        match: {
          'data.L_BedroomTotal': property.L_BedroomTotal,
        },
      },
      {
        match: {
          'data.PropertyType': property.PropertyType,
        },
      },
    ];

    if (property.Area) {
      filter.push({ match: { 'data.Area': property.Area } });
    } else {
      filter.push({
        match: {
          'data.Province_State': property.Province_State as string,
        },
      });
      filter.push({
        match: {
          'data.PostalCode_Zip': property.PostalCode_Zip as string,
        },
      });
    }

    return await retrieveFromLegacyPipeline({
      from: 0,
      size: limit,
      sort: { 'data.ListingDate': 'desc' },
      query: {
        bool: {
          filter,
          must_not: must_not.concat([
            { match: { 'data.Address': property.Address } },
          ]),
        },
      },
    });
  }
  return [];
}

export async function getPropertyData(
  property_id: number | string,
  id_is_mls = false
) {
  const axios: AxiosStatic = (await import('axios')).default;
  const xhr = await axios
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
          Authorization: `Bearer ${
            process.env.NEXT_APP_CMS_API_KEY as string
          }`,
          'Content-Type': 'application/json',
        },
      }
    )
    .catch((e) => {
      console.log(
        'ERROR in getPropertyData.axios for id',
        property_id,
        '\n',
        e.message,
        '\n\n'
      );
    });

  let clean: Record<string, unknown> | MLSProperty = {};
  const neighbours: MLSProperty[] = [];
  const sold_history: MLSProperty[] = [];
  if (xhr && xhr.data) {
    const { property, properties } = id_is_mls
      ? xhr.data.data
      : xhr.data.data;

    const { mls_data } = id_is_mls
      ? properties.data[0].attributes
      : property.data.attributes;
    Object.keys(mls_data).map((key: string) => {
      if (mls_data[key]) {
        clean = {
          ...clean,
          [key]: mls_data[key],
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
          Authorization: `Basic ${Buffer.from(
            `${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    hits.forEach(({ _source }: { _source: unknown }) => {
      const { data: hit } = _source as {
        data: Record<string, unknown>;
      };
      let property = {
        Address: '',
        Status: '',
      };
      Object.keys(hit as Record<string, unknown>).forEach((key) => {
        if (hit[key]) {
          property = {
            ...property,
            [key]: hit[key],
          };
        }
      });
      if (
        property.Status === 'Sold' &&
        property.Address === clean.Address
      )
        sold_history.push(property as MLSProperty);
      else if (property.Status === 'Active')
        neighbours.push(property as MLSProperty);
    });
  }

  return {
    ...(clean as MLSProperty),
    neighbours,
    sold_history,
  };
}

export function formatValues(
  obj: MLSProperty | Record<string, string>,
  key: string
): string {
  if (!obj || !obj[key]) return '';

  if (NumericFields.includes(key)) {
    return new Intl.NumberFormat(undefined).format(
      parseInt((obj as Record<string, string>)[key], 10) as number
    );
  }

  if (FinanceFields.includes(key) && !isNaN(Number(obj[key]))) {
    return `$${new Intl.NumberFormat(undefined).format(
      obj[key] as number
    )}`;
  }

  if (DateFields.includes(key)) {
    return dateStringToDMY(obj[key] as string);
  }
  return obj[key] as unknown as string;
}

export function combineAndFormatValues(
  values: Record<string, number | string>
): string {
  // Last year taxes
  if (
    Object.keys(values).includes('L_GrossTaxes') &&
    Object.keys(values).includes('ForTaxYear')
  ) {
    return `${formatValues(
      values as MLSProperty,
      'L_GrossTaxes'
    )} (${values.ForTaxYear})`;
  }
  return Object.keys(values)
    .map((key) => values[key])
    .join(' ');
}
