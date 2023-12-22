import { consoler } from '@/_helpers/consoler';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { PropertyDataModel } from '@/_typings/property';
import { mapData } from '@/app/api/pipeline/subroutines';
import axios, { AxiosError, AxiosStatic } from 'axios';
const FILE = 'call-legacy-search.ts';
export async function retrieveFromLegacyPipeline(
  params: LegacySearchPayload = DEF_LEGACY_PAYLOAD,
  config = {
    url: process.env.NEXT_APP_LEGACY_PIPELINE_URL as string,
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  },
  include_mls: number = 1,
): Promise<PropertyDataModel[]> {
  try {
    const axios: AxiosStatic = (await import('axios')).default;
    const {
      data: {
        hits: { hits },
      },
    } = await axios.post(config.url, params, {
      headers: config.headers,
    });
    const listings = mapData(hits);

    return listings;
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

      let property: { [key: string]: unknown } = {};
      Object.keys(hit as Record<string, unknown>).forEach(key => {
        if (hit[key]) {
          const legacy_key = _source || key.substring(0, 5) !== 'data.' ? key : key.split('.')[1];
          const strapi_key = STRAPI_FIELDS[legacy_key];
          const value_csv = _source || key === 'data.photos' || key === 'photos' ? hit[key] : (hit[key] as string[] | number[]).join(',');
          // STRAPI_FIELDS
          if (strapi_key) {
            property = {
              ...property,
              [strapi_key]: value_csv,
            };
          }
          if (value_csv) {
            if (include_mls === 1)
              property = {
                ...property,
                [legacy_key]: value_csv,
              };
            else if (include_mls === 2) {
              property = {
                ...property,
                mls_data: {
                  ...(property.mls_data || {}),
                  [legacy_key]: value_csv,
                },
              };
            }
          }
        } else delete hit[key];
      });

      return property as unknown as PropertyDataModel;
    });
  } catch (e) {
    const { response } = e as unknown as AxiosError;
    return [];
  }
}

export async function retrievePublicListingsFromPipeline(params: LegacySearchPayload = DEF_LEGACY_PAYLOAD) {
  const { data } = await axios.post('/api/pipeline', params);
  return data;
}

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
        gte: new Date(new Date().getTime() - 4 * 60 * 60000).toISOString().substring(0, 19),
      },
    },
  },
];

export const DEF_LEGACY_PAYLOAD: LegacySearchPayload = {
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
};

/// From integrations API
export const STRAPI_FIELDS: {
  [key: string]: string;
} = {
  // ids
  MLS_ID: 'mls_id',
  ListingID: 'guid',

  // Dates
  UpdateDate: 'updatedAt',

  // geolocation
  lat: 'lat',
  lng: 'lon',
  // Viva uses Coordinates

  // address
  Address: 'title',
  AddressUnit: 'building_unit',
  Area: 'area',
  City: 'city',
  L_Region: 'region',
  Province_State: 'state_province',
  PostalCode_Zip: 'postal_zip_code',
  L_ComplexName: 'complex_compound_name',
  L_SubareaCommunity: 'subarea_community',

  //allowed_pets
  LFD_BylawRestrictions_58: 'building_by_laws',
  L_Cats: 'pets_allowed',
  L_Dogs: 'pets_allowed',

  // beds baths
  L_FullBaths: 'full_baths',
  L_HalfBaths: 'half_baths',
  L_BedroomTotal: 'beds',
  L_TotalBaths: 'baths',
  B_Basement: 'basement',

  L_KitchensTotal: 'total_kitchens',

  // building info
  LFD_Roof_43: 'roofing',
  B_Roof: 'roofing',
  Type: 'style_type',
  LFD_StyleofHome_32: 'style_type',
  PropertyType: 'property_type',
  L_TotalUnits: 'building_total_units',
  L_Stories: 'floors',
  L_NoFloorLevels: 'floor_levels',
  L_Age: 'age',
  L_YearBuilt: 'year_built',
  Reno_Year: 'year_last_renovated',
  L_Fireplaces: 'total_fireplaces',
  L_Frontage_Metres: 'frontage_metres',
  L_Frontage_Meters: 'frontage_metres',
  L_Frontage_Feet: 'frontage_feet',
  L_MeasurmentType: 'floor_area_uom',
  L_FloorArea_GrantTotal: 'floor_area',
  L_FloorArea_Basement: 'floor_area_basement',
  field_3018: 'floor_area_basement',
  L_FloorArea_Main: 'floor_area_main',
  L_FloorArea_Unfinished: 'floor_area_unfinished',
  field_3128: 'floor_area_unfinished',
  L_FloorArea_BelowMain: 'floor_area_below_main',
  L_FloorArea_Total: 'floor_area_total',
  LFD_ExteriorFinish_42: 'exterior_finish',
  LFD_FloorFinish_19: 'floorings',
  LandTitle: 'land_title',
  LFD_Foundation_155: 'foundation_specs',
  LFD_Foundation_156: 'foundation_specs',
  B_Depth: 'depth',
  B_Style: 'building_style',

  // community info
  NumberofUnitsInCommunity: 'num_units_in_community',

  // dates
  ListingDate: 'listed_at',

  // fireplace
  L_Fireplace_Fuel: 'fireplace',
  LFD_FireplaceFueledby_49: 'fireplace',

  // land / lot info
  L_LotSize_SqMtrs: 'lot_sqm',
  L_LotSize_SqFt: 'lot_sqft',
  L_LotSize_Acres: 'lot_sqft',
  L_LotSize_Hectares: 'lot_sqft',
  Zoning: 'zoning',

  // notes / description
  L_PublicRemakrs: 'description',

  // parking
  L_Parking_covered: 'total_covered_parking',
  L_Parking_total: 'total_parking',
  B_Parking_Type: 'parkings',
  B_Parking_Access: 'parkings',

  // pricing
  AskingPrice: 'asking_price',
  SoldPrice: 'sold_price',
  ClosingDate: 'closed_at',
  OffMarketDate: 'off_market_at',
  L_Sold_PricePerSqFt: 'sold_price_per_sqft',

  PricePerSQFT: 'price_per_sqft',
  L_StrataFee: 'strata_fee',

  // strata / bylaws
  L_TotalRentalsAllowed: 'total_allowed_rentals',
  L_PetsTotal: 'total_pets_allowed',

  // tax
  ForTaxYear: 'tax_year',
  L_GrossTaxes: 'gross_taxes',

  // board status
  Status: 'status',
  photos: 'photos',

  // real estate board name - possible
  L_ShortRegionCode: 'L_ShortRegionCode',
  OriginatingSystemName: 'OriginatingSystemName',
  LA1_Board: 'LA1_Board',
  LA2_Board: 'LA2_Board',
  LA3_Board: 'LA3_Board',
  LA4_Board: 'LA4_Board',
  ListAgent1: 'ListAgent1',
  LO1_Brokerage: 'LO1_Brokerage',

  // Agent info
  LA1_LoginName: 'LA1_LoginName',
  LA2_LoginName: 'LA1_LoginName',
  LA3_LoginName: 'LA1_LoginName',
  LA1_Email: 'LA1_Email',
  LA2_Email: 'LA2_Email',
  LA3_Email: 'LA3_Email',
  LA1_FullName: 'LA1_FullName',
  LA2_FullName: 'LA2_FullName',
  LA3_FullName: 'LA3_FullName',
  LA1_PhoneNumber1: 'LA1_PhoneNumber1',
  LA2_PhoneNumber1: 'LA2_PhoneNumber1',
  LA3_PhoneNumber1: 'LA3_PhoneNumber1',

  // Brokerages
  LO1_Name: 'main_brokerage',
  LO2_Name: 'secondary_brokerage',
  LO3_Name: 'alt_brokerage',

  // Amenities relationships.
  L_View_Desc: 'panoramic_views',
  LFD_FuelHeating_48: 'heating',
  B_Heating: 'heating',
  B_Amenities: 'amenities',
  B_OutdoorArea: 'amenities',

  // Appliances
  L_Features: 'appliances',
  LFD_FeaturesIncluded_55: 'appliances',
  LFD_FeaturesIncluded_142: 'appliances',

  // Connected Services
  B_Services: 'connected_services',
  LFD_ServicesConnected_7: 'connected_services',
  LFD_WaterSupply_8: 'connected_services',

  // Build features
  B_Construction: 'build_features',
  B_ConstructionMaterials: 'build_features',
  B_Exterior_Finish: 'exterior_finish',

  // Places of Interest
  B_SiteInfluences: 'places_of_interest',
};

export const MLS_FIELDS_SKIPPED = [
  'None',
  'CDOM',
  'DOM',
  'L_PID',
  'LO1_URL',
  'LO2_URL',
  'LO3_URL',
  'ViewDesc',
  'Remarks',
  'InputDate',
  'LO1_Phone',
  'LO2_PHone',
  'FloodPlain',
  'IdxInclude',
  'ListAgent2',
  'LA2_WebPage',
  'L_Commision',
  'ListOffice1',
  'ListOffice2',
  'LM_Char10_11',
  'LM_char10_75',
  'LM_char50_11',
  'LM_char50_12',
  'PictureCount',
  'AddressNumber',
  'AddressStreet',
  'OriginalPrice',
  'ExpirationDate',
  'Last_Photo_updt',
  'B_PermitApproved',
  'B_SketchAttached',
  'LO1_Abbreviation',
  'LO2_Abbreviation',
  'L_DisplayAddress',
  'L_DisplayListing',
  'L_FixturesRented',
  'LFD_Renovations_4',
  'LFD_BasementArea_6',
  'PropertyDisclosure',
  'B_RezoningPotential',
  'StreetDesignationId',
  'TaxUtilitiesInclude',
  'L_BedroomNOTBasement',
  'L_FixturesRemoved_YN',
  'B_InfoPackageAvailable',
];
