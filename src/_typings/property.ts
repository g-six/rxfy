import { PlaceDetails } from './maps';

export const DateFields = ['UpdateDate', 'ListingDate'];

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
  'B_Depth',
  'L_Frontage_Feet',
  'L_FloorArea_Total',
  'L_FloorArea_Finished_AboveMainFloor',
  'L_FloorArea_Main',
  'L_FloorArea_GrantTotal',
  'L_LotSize_SqMtrs',
  'floor_area',
];

export const FinanceFields = ['asking_price', 'AskingPrice', 'PricePerSQFT', 'L_GrossTaxes', 'SoldPrice'];

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
  asking_price: number;
  state_province?: string;
  city: string;
  mls_id: string;
  property_type: string;
  lon?: number;
  lat?: number;
  beds?: number;
  baths?: number;
  price_per_sqft?: number;
  guid?: string;
  changes_applied?: string;
  age?: number;
  year_built?: number;
  fireplace?: string;
  garage?: 'None' | 'Single' | 'Double' | 'Triple';
  postal_zip_code?: string;
  parking?: string;
  style_type?: string;
  status?: 'Active' | 'Expired' | 'Sold';
  listed_at?: Date;
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
  construction_information?: string;
  floor_area_total?: number;
  floor_area_basement?: number;
  floor_area_unfinished?: number;
  floor_area_upper_floors?: number;
}

export interface PropertyInput extends BasePropertyDataModel {
  real_estate_board?: number;
}

export interface PropertyDataModel extends BasePropertyDataModel {
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

  amenities?: PropertyAssociations;
  appliances?: PropertyAssociations;
  build_features?: PropertyAssociations;
  connected_services?: PropertyAssociations;
  facilities?: PropertyAssociations;
  hvac?: PropertyAssociations;
  photos?: string[]; // to remove
}

export interface MLSProperty extends Record<string, string | number | boolean | string[]> {
  lat: number;
  lng: number;
  Address: string;
  AddressUnit: string;
  PostalCode_Zip: string;
  Area: string;
  AskingPrice: number;
  B_ServicesConnected: string[];
  CDOM: number;
  City: string;
  Province_State: string;
  ForTaxYear: number;
  LandTitle: string;
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
                          attributes {
                            photos
                          }
                        }
                      }
`;

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
