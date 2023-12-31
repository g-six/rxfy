import { PlaceDetails } from './maps';

export const DateFields = ['UpdateDate', 'ListingDate', 'listed_at', 'closed_at'];
export const PROPERTY_ASSOCIATION_KEYS: string[] = [
  'amenities',
  'appliances',
  'build_features',
  'connected_services',
  'facilities',
  'heating',
  'hvac',
  'items_maintained',
  'property_photo_album',
  'types',
];
type PropertyAssociations = {
  data?: {
    id?: number;
    attributes: {
      name: string;
    };
  }[];
};

export type BathroomDetails = {
  ensuite?: string;
  pieces?: number;
  level: string;
};
export type RoomDetails = {
  type: string;
  length: string;
  width: string;
  level: string;
};

export enum DwellingType {
  APARTMENT_CONDO = 'APARTMENT_CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  HOUSE = 'HOUSE_SINGLE_FAMILY,HOUSE_W_ACREAGE',
  ROW_HOUSE = 'ROW_HOUSE',
  MANUFACTURED = 'MANUFACTURED,MANUFACTURED_W_LAND',
  DUPLEX = 'HALF_DUPLEX,FULL_DUPLEX',
  OTHER = 'OTHER',
}

export const NumericFields = [
  'beds',
  'baths',
  'depth',
  'frontage_metres', // 'L_Frontage_Feet',
  'floor_area_upper_floors', //'L_FloorArea_Finished_AboveMainFloor',
  'floor_area_main', //'L_FloorArea_Main',
  // 'L_FloorArea_GrantTotal',
  'lot_sqm', // 'L_LotSize_SqMtrs',
  'lot_sqft', // '',
  'lot_area',
  'floor_area',
  'floor_area_total',
  'floor_area_sqft',
  'floor_area_sqm',
  'full_baths',
  'garages',
  'half_baths',
  'total_additional_rooms',
  'total_kitchens',
  'total_parking',
  'total_allowed_rentals',
  'year_built',
  'tax_year',
  'sqft',
];

export const FinanceFields = ['asking_price', 'sold_price', 'price_per_sqft', 'sold_price_per_sqft', 'gross_taxes', 'SoldPrice', 'strata_fee'];
export const UnitOfMeasurementFields: string[] = ['floor_area_uom', 'lot_uom'];

export enum PropertyStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  ACTIVE_INDEX = '0',
  SOLD_INDEX = '1',
}

export enum PropertySortBy {
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  SIZE_ASC = 'size_asc',
  SIZE_DESC = 'size_desc',
}

export interface BasePropertyDataModel {
  id?: number;
  title: string;
  area: string;
  building_unit?: string | number;
  asking_price: number;
  sold_price?: number;
  state_province?: string;
  city: string;
  mls_id: string;
  property_type?: string;
  lon?: number;
  lat?: number;
  beds?: number;
  baths?: number;
  price_per_sqft?: number;
  sold_price_per_sqft?: number;
  guid?: string;
  changes_applied?: string;
  age?: number;
  year_built?: number;
  fireplace?: string;
  garage?: 'None' | 'Single' | 'Double' | 'Triple';
  postal_zip_code?: string;
  style_type?: string;
  status?: 'Active' | 'Expired' | 'Sold';
  listed_at?: Date;
  closed_at?: Date;
  land_title?: string;
  gross_taxes?: number;
  original_price?: number;
  lot_sqm?: number;
  lot_sqft?: number;
  floor_area?: number;
  floor_area_main?: number;
  floor_area_uom?: 'Meters' | 'Feet';
  tax_year?: number;
  description?: string;
  idx_include?: boolean;
  roofing?: string;
  region?: string;
  residential_type?: string;
  building_type?: string;
  heating?: string;
  year_last_renovated?: number;
  room_details?: {
    rooms: RoomDetails[];
  };
  bathroom_details?: {
    baths: BathroomDetails[];
  };
  windows?: string;
  subarea_community?: string;
  depth?: number;
  strata_fee?: number;
  frontage_feet?: number;
  frontage_metres?: number;
  other_appliances?: string;
  safety_security_features?: string;
  garden_lawn_features?: string;
  foundation_specs?: string;
  exterior_finish?: string;
  other_information?: string;
  complex_compound_name?: string;
  floor_area_total?: number;
  floor_area_basement?: number;
  floor_area_unfinished?: number;
  floor_area_upper_floors?: number;
  listing_by?: string;
}

export interface PropertyInput extends BasePropertyDataModel {
  real_estate_board?: number;
}

export interface PropertyDataObject extends BasePropertyDataModel {
  real_estate_board?: {
    data?: {
      id?: number;
      attributes: {
        legal_disclaimer: string;
      };
    };
  };
  property_photo_album?: {
    data?: {
      id?: number;
      attributes: {
        photos: string;
      };
    };
  };

  amenities?: string[];
  appliances?: string[];
  build_features?: string[];
  connected_services?: string[];
  facilities?: string[];
  hvac?: string[];
  parking?: string[];
  places_of_interest?: string[];
  items_maintained?: PropertyAssociations;
  photos?: string[]; // to remove
}
export interface PropertyDataModel extends BasePropertyDataModel {
  real_estate_board?: {
    id?: number;
    legal_disclaimer: string;
    data?: {
      id?: number;
      attributes: {
        legal_disclaimer: string;
      };
    };
  };
  property_photo_album?: {
    data?: {
      id?: number;
      attributes: {
        photos: string;
      };
    };
  };

  amenities?: PropertyAssociations;
  appliances?: PropertyAssociations;
  build_features?: PropertyAssociations;
  connected_services?: PropertyAssociations;
  facilities?: PropertyAssociations;
  parking?: PropertyAssociations;
  places_of_interest?: PropertyAssociations;
  hvac?: PropertyAssociations;
  items_maintained?: PropertyAssociations;
  photos?: string[]; // to remove
  cover_photo?: string;
  mls_data?: MLSProperty;
  floor_area_total?: number;
  id?: number;
}

export interface MLSProperty extends Record<string, string | number | boolean | string[]> {
  lat: number;
  lng: number;
  Address: string;
  AddressUnit: string;
  PostalCode_Zip: string;
  Area: string;
  AskingPrice: number;
  ClosingDate: string;
  SoldPrice: number;
  L_Sold_PricePerSqFt: number;
  B_ServicesConnected: string[];
  CDOM: number;
  City: string;
  Province_State: string;
  ForTaxYear: number;
  LandTitle: string;
  ListingID: string;
  ListingDate: string;
  MLS_ID: string;
  PricePerSQFT: number;
  PropertyType: string;
  Status: 'Active' | 'Sold';
  B_Amenities: string;
  B_Depth: number;
  B_Heating: string;
  B_Parking_Access: string;
  B_Parking_Type: string[];
  B_Style: string;
  B_OutdoorArea: string[];
  LO1_URL: string;
  LO2_URL: string;
  L_Age: number;
  L_PID: number;
  L_Region: string;
  L_BedroomTotal: number;
  L_Fireplaces: number;
  L_FloorArea_Total: number;
  L_FloorArea_GrantTotal: number;
  L_GrossTaxes: number;
  L_KitchensTotal: number;
  L_LotSize_SqMtrs: number;
  L_Parking_covered: number;
  L_Parking_total: number;
  L_PublicRemakrs: string;
  L_TotalBaths: number;
  L_YearBuilt: number;
  LFD_Amenities_56: string[];
  LFD_BylawRestrictions_58: string[];
  LFD_ExteriorFinish_42: string[];
  LFD_FeaturesIncluded_55: string[];
  LFD_FloorFinish_50: string[];
  LFD_Foundation_156: string[];
  LFD_FuelHeating_48: string[];
  LFD_MaintFeeIncludes_57: string[];
  LFD_OutdoorArea_47: string[];
  LFD_OutdoorArea_146: string[];
  LFD_Parking_44: string[];
  LFD_Roof_43: string[];
  LFD_StyleofHome_32: string[];
  LFD_SiteInfluences_46: string[];
  Remarks: string;
  Zoning: string;
  L_ShortRegionCode: string;
  OriginatingSystemName: string;

  // Real Estate Board Data
  LA1_Board: string;
  LA2_Board: string;
  LA3_Board: string;
  LA4_Board: string;
  ListAgent1: string;
  LO1_Brokerage: string;

  // Agent Names
  LA1_FullName: string;
  LA2_FullName: string;
  LA3_FullName: string;
  SO1_FullName: string;
  SO2_FullName: string;
  SO3_FullName: string;
  LO1_Name: string;
  LO2_Name: string;
  LO3_Name: string;

  // Agent IDs
  LA1_LoginName: string;
  LA2_LoginName: string;
  LA3_LoginName: string;

  // Agent Phones
  LA1_PhoneNumber1: string;
  LA2_PhoneNumber1: string;
  LA3_PhoneNumber1: string;

  // Agent Emails
  LA1_Email: string;
  LA2_Email: string;
  LA3_Email: string;

  // Rooms Data:
  L_Room1_Type: string;
  L_Room1_Level: string;
  L_Room1_Dimension1: string;
  L_Room1_Dimension2: string;
  L_Room2_Type: string;
  L_Room2_Level: string;
  L_Room2_Dimension1: string;
  L_Room2_Dimension2: string;
  L_Room3_Type: string;
  L_Room3_Level: string;
  L_Room3_Dimension1: string;
  L_Room3_Dimension2: string;
  L_Room4_Type: string;
  L_Room4_Level: string;
  L_Room4_Dimension1: string;
  L_Room4_Dimension2: string;
  L_Room5_Type: string;
  L_Room5_Level: string;
  L_Room5_Dimension1: string;
  L_Room5_Dimension2: string;
  L_Room6_Type: string;
  L_Room6_Level: string;
  L_Room6_Dimension1: string;
  L_Room6_Dimension2: string;
  L_Room7_Type: string;
  L_Room7_Level: string;
  L_Room7_Dimension1: string;
  L_Room7_Dimension2: string;
  L_Room8_Type: string;
  L_Room8_Level: string;
  L_Room8_Dimension1: string;
  L_Room8_Dimension2: string;

  // Amenities Data
  B_SiteInfluences: string;
  B_Bylaws: string;
  L_Fireplace_Fuel: string;
  L_Floor_Finish: string;
  L_Locker: string;

  Reno_Year: number;
  L_SubareaCommunity: string;
  Type: string;
}

interface BaseKeyValuePairStateProps {
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | google.maps.places.AutocompletePrediction
    | google.maps.places.AutocompletePrediction[]
    | PlaceDetails
    | string[]
    | Date;
}

export type PropertyAttributeFilters = {
  beds?: number;
  baths?: number;
  minprice?: number;
  maxprice?: number;
  minsqft?: number;
  maxsqft?: number;
  types?: string[];
  dt_from?: Date;
  dt_to?: Date;
  tags?: string[];
  agent?: string;
};

export interface MapStateProps extends BaseKeyValuePairStateProps {
  is_loading?: boolean;
  reload?: boolean;
  query: string;
  address?: string;
  city?: string;
  dwelling_type?: string;
  ptype?: string[];
  place?: google.maps.places.AutocompletePrediction;
  suggestions: google.maps.places.AutocompletePrediction[];
  details?: PlaceDetails;
}

export interface LovedPropertyDataModel extends PropertyDataModel {
  love?: number;
  notes?: string;
}

export type MapStatePropsWithFilters = MapStateProps & PropertyAttributeFilters;

export const GQ_FRAGMENT_PROPERTY_ATTRIBUTES = `
                      age
                      area
                      asking_price
                      basement
                      baths
                      bathroom_details
                      room_details
                      beds
                      building_by_laws
                      changes_applied
                      city
                      complex_compound_name
                      depth
                      description
                      exterior_finish
                      fireplace
                      floor_area
                      floor_area_basement
                      floor_area_total
                      floor_area_unfinished
                      floor_area_uom
                      floor_area_upper_floors
                      foundation_specs
                      frontage_feet
                      frontage_metres
                      garage
                      gross_taxes
                      guid
                      heating
                      land_title
                      lat
                      listed_at
                      lon
                      lot_sqft
                      lot_sqm
                      mls_data
                      mls_id
                      original_price
                      other_appliances
                      other_information
                      postal_zip_code
                      price_per_sqft
                      property_type
                      region
                      residential_type
                      roofing
                      safety_security_features
                      state_province
                      status
                      strata_fee
                      style_type
                      subarea_community
                      tax_year
                      title
                      total_fireplaces
                      total_parking
                      total_covered_parking
                      year_built
                      year_last_renovated
                      amenities {
                          data {
                              id
                              attributes {
                                  name
                              }
                          }
                      }
                      appliances {
                          data {
                              id
                              attributes {
                                  name
                              }
                          }
                      }
                      build_features {
                          data {
                              id
                              attributes {
                                  name
                              }
                          }
                      }
                      connected_services {
                          data {
                              id
                              attributes {
                                  name
                              }
                          }
                      }
                      facilities {
                          data {
                              id
                              attributes {
                                  name
                              }
                          }
                      }
                      hvac {
                          data {
                              id
                              attributes {
                                  name
                              }
                          }
                      }
                      parking {
                          data {
                              id
                              attributes {
                                  name
                              }
                          }
                      }
                      places_of_interest {
                          data {
                              id
                              attributes {
                                  name
                              }
                          }
                      }
                      real_estate_board {
                        data {
                          attributes {
                            name
                            legal_disclaimer
                          }
                        }
                      }
                      property_photo_album {
                        data {
                          id
                          attributes {
                            photos
                          }
                        }
                      }
                      data_groups
`;

export interface SoldPropertyInput {
  date_sold: string;
  sold_at_price: number;
  mls_id: string;
  property: number;
}

export const GQL_MARK_SOLD = `mutation AddHistory($input: SoldPropertyInput!) {
  createSoldProperty(data: $input) {
    data {
      id
      attributes {
        date_sold
        sold_at_price
        mls_id
        property {
          data {
            attributes {
              title
              city
              area
              mls_id
            }
          }
        }
      }
    }
  }
}`;

export interface PropertyPageData extends PropertyDataModel {
  photos?: string[];
  neighbours?: MLSProperty[];
  sold_history?: MLSProperty[];
  agent_info: {
    company: string;
    tel: string;
    email: string;
    name: string;
  };
}
