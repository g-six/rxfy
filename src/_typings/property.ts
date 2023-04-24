import { PlaceDetails } from './maps';

export const DateFields = ['UpdateDate', 'ListingDate'];

export const NumericFields = [
  'B_Depth',
  'L_Frontage_Feet',
  'L_FloorArea_Total',
  'L_FloorArea_Finished_AboveMainFloor',
  'L_FloorArea_Main',
  'L_FloorArea_GrantTotal',
  'L_LotSize_SqMtrs',
];

export const FinanceFields = ['AskingPrice', 'PricePerSQFT', 'L_GrossTaxes', 'SoldPrice'];

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

export interface PropertyDataModel {
  id: number;
  title: string;
  area: string;
  asking_price: number;
  city: string;
  mls_id: string;
  property_type: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  price_per_sqft?: number;
  guid?: string;
  changes_applied?: string;
  real_estate_board?: number;
  age?: number;
  year_built?: number;
  fireplace?: string;
  has_laundry?: boolean;
  has_dishwasher?: boolean;
  has_fridge?: boolean;
  has_stove?: boolean;
  has_hvac?: boolean;
  has_deck?: boolean;
  has_patio?: boolean;
  has_balcony?: boolean;
  has_fenced_yard?: boolean;
  garage?: 'None' | 'Single' | 'Double' | 'Triple';
  postal_zip_code?: string;
  parking?: string;
  style_type?: string;
  status?: 'Active' | 'Expired';
  has_storage?: boolean;
  listed_at?: Date;
  land_title?: string;
  gross_taxes?: number;
  original_price?: number;
  lot_sqm?: number;
  lot_sqft?: number;
  floor_area?: number;
  floor_area_uom?: 'Meters' | 'Feet';
  tax_year?: number;
  description?: string;
  idx_include?: boolean;
  roofing?: string;
}

export interface MLSProperty extends Record<string, string | number | boolean | string[]> {
  lat: number;
  lng: number;
  Address: string;
  AddressUnit: string;
  Area: string;
  AskingPrice: number;
  B_ServicesConnected: string[];
  CDOM: number;
  City: string;
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
  B_Style: string;
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
  ptype?: string[];
  place?: google.maps.places.AutocompletePrediction;
  suggestions: google.maps.places.AutocompletePrediction[];
  details?: PlaceDetails;
}

export interface LovedPropertyDataModel extends PropertyDataModel {
  love?: number;
}

export type MapStatePropsWithFilters = MapStateProps & PropertyAttributeFilters;
