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
      let property = {};
      Object.keys(hit as Record<string, unknown>).forEach((key) => {
        if (hit[key]) {
          property = {
            ...property,
            [key]: hit[key],
          };
        }
      });
      neighbours.push(property as MLSProperty);
    });
  }

  return {
    ...clean,
    neighbours,
  };
}

export function formatValues(
  value: string | number,
  key: string
): string {
  if (!value || value === '0') return '';

  if (NumericFields.includes(key)) {
    return new Intl.NumberFormat(undefined).format(value as number);
  }

  if (FinanceFields.includes(key)) {
    return `$${new Intl.NumberFormat(undefined).format(
      value as number
    )}`;
  }

  if (DateFields.includes(key)) {
    return dateStringToDMY(value as string);
  }
  return value as unknown as string;
}

export function combineAndFormatValues(
  values: Record<string, number | string>
): string {
  // Last year taxes
  if (
    Object.keys(values).includes('L_GrossTaxes') &&
    Object.keys(values).includes('ForTaxYear')
  ) {
    return `${formatValues(values.L_GrossTaxes, 'L_GrossTaxes')} (${
      values.ForTaxYear
    })`;
  }
  return Object.keys(values)
    .map((key) => values[key])
    .join(' ');
}
