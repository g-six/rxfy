import { BathroomDetails, RoomDetails } from './property';

export const LISTING_NUMERICAL_FIELDS = [
  'lat',
  'lon',
  'beds',
  'baths',
  'price_per_sqft',
  'asking_price',
  'year_built',
  'total_garage',
  'gross_taxes',
  'tax_year',
  'floor_area',
  'floor_area_main',
  'floor_area_basement',
  'floor_area_below_main',
  'floor_area_total',
  'floor_area_unfinished',
  'floor_area_upper_floors',
  'frontage_feet',
  'frontage_metres',
  'full_baths',
  'half_baths',
  'total_kitchens',
  'total_additional_rooms',
  'garages',
  'depth',
  'frontage',
  'lot_area',
  'strata_fee',
  'total_allowed_rentals',
  'total_parking',
  'total_covered_parking',
  'total_fireplaces',
  'floor_levels',
  'total_units_in_community',
  'age',
  'age_restriction',
  'total_pets_allowed',
  'total_dogs_allowed',
  'total_cats_allowed',
];

export const LISTING_FREE_TEXT_FIELDS = [
  'title',
  'area',
  'city',
  'postal_zip_code',
  'state_province',
  'listed_at',
  'land_title',
  'neighbourhood',
  'complex_compound_name',
  'fireplace',
  'roofing',
  'region',
  'building_unit',
  'pets',
  'property_disclosure',
  'building_bylaws',
  'restrictions',
  'description',
  'video_link',
  'exterior_finish',
  'foundation_specs',
];

export const LISTING_REL_ID_FIELDS = [
  'dwelling_type',
  'property_photo_album',
  'amenities',
  'appliances',
  'building_maintenance_items',
  'by_law_restrictions',
  'connected_services',
  'facilities',
  'hvacs',
  'parkings',
  'allowed_pets',
  'places_of_interest',
  'construction_information',
  'realtor',
  'building_style',
  'land_title_taxonomy',
];

export const LISTING_ENUM_FIELDS = ['floor_area_uom', 'frontage_uom', 'lot_uom', 'status'];
export const LISTING_BOOL_FIELDS = ['council_approval_required'];

export interface PrivateListingModel {
  id?: number;
  title?: string;
  description?: string;
  lat?: number;
  lon?: number;
  area?: string;
  city?: string;
  beds?: number;
  baths?: number;
  postal_zip_code?: string;
  state_province?: string;
  status?: 'active' | 'draft' | 'sold' | 'terminated';
  price_per_sqft?: number;
  asking_price?: number;
  year_built?: number;
  total_garage?: number;
  listed_at?: Date;
  land_title?: string;
  gross_taxes?: number;
  tax_year?: number;
  lot_area?: number;
  lot_area_uom?: 'sqft' | 'sqm';
  total_additional_rooms?: number;
  floor_area?: number;
  floor_area_main?: number;
  floor_area_basement?: number;
  floor_area_upper_floors?: number;
  floor_area_unfinished?: number;
  floor_area_total?: number;
  floor_area_below_main?: number;
  floor_area_uom?: 'sqft' | 'sqm';
  lot_uom?: 'sqft' | 'sqm' | 'acres';
  frontage_feet?: number;
  frontage_metres?: number;
  property_photo_album?: number;
  neighbourhood?: string;
  full_baths?: number;
  half_baths?: number;
  total_kitchens?: number;
  complex_compound_name?: string;
  fireplace?: string;
  roofing?: string;
  region?: string;
  room_details?: {
    rooms: RoomDetails[];
    kitchens?: RoomDetails[];
    garages?: RoomDetails[];
    others?: RoomDetails[];
  };
  bathroom_details?: {
    baths: BathroomDetails[];
  };
  depth?: number;
  strata_fee?: number;
  frontage?: number;
  council_approval_required?: boolean;
  frontage_uom?: 'Feet' | 'Metres';
  building_unit?: string;
  total_allowed_rentals?: number;
  total_parking?: number;
  total_covered_parking?: number;
  total_fireplaces?: number;
  floor_levels?: number;
  total_pets_allowed?: number;
  total_cats_allowed?: number;
  total_dogs_allowed?: number;
  total_units_in_community?: number;
  photos?: string[];
  place_id?: string;
}
export interface PrivateListingInput extends PrivateListingModel {
  building_style?: number;
  dwelling_type?: number;
  land_title_taxonomy?: number;
  amenities?: number[];
  appliances?: number[];
  building_maintenance_items?: number[];
  by_law_restrictions?: number[];
  building_bylaws?: string;
  restrictions?: string;
  connected_services?: number[];
  facilities?: number[];
  hvacs?: number[];
  parkings?: number[];
  allowed_pets?: number[];
  places_of_interest?: number[];
  construction_information?: number[];
  minimum_age_restriction?: number;
}

export interface PrivateListingOutput extends PrivateListingModel {
  id: number;
  dwelling_type: { id: number; name: string };
  amenities?: { id: number; name: string }[];
  appliances?: { id: number; name: string }[];
  building_maintenance_items?: { id: number; name: string }[];
  by_law_restrictions?: { id: number; name: string }[];
  connected_services?: { id: number; name: string }[];
  facilities?: { id: number; name: string }[];
  hvacs?: { id: number; name: string }[];
  parkings?: { id: number; name: string }[];
  allowed_pets?: { id: number; name: string }[];
  places_of_interest?: { id: number; name: string }[];
  construction_information?: { id: number; name: string }[];
}

export interface PrivateListingResult {
  id: number;
  attributes: PrivateListingModel & {
    dwelling_type: { data: { id: number; attributes: { name: string } } };
    amenities?: { data: { id: number; attributes: { name: string } }[] };
    appliances?: { data: { id: number; attributes: { name: string } }[] };
    building_maintenance_items?: { data: { id: number; attributes: { name: string } }[] };
    by_law_restrictions?: { data: { id: number; attributes: { name: string } }[] };
    connected_services?: { data: { id: number; attributes: { name: string } }[] };
    facilities?: { data: { id: number; attributes: { name: string } }[] };
    hvacs?: { data: { id: number; attributes: { name: string } }[] };
    parkings?: { data: { id: number; attributes: { name: string } }[] };
    allowed_pets?: { data: { id: number; attributes: { name: string } }[] };
    places_of_interest?: { data: { id: number; attributes: { name: string } }[] };
    construction_information?: { data: { id: number; attributes: { name: string } }[] };
  };
}
