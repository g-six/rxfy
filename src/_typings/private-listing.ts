export interface PrivateListingModel {
  title: string;
  lat: number;
  lon: number;
  area: string;
  city: string;
  beds: number;
  baths: number;
  postal_zip_code: string;
  state_province: string;
  price_per_sqft?: number;
  asking_price?: number;
  year_built?: number;
  garage?: 'single' | 'double' | 'triple';
  listed_at?: Date;
  land_title?: string;
  gross_taxes?: number;
  tax_year?: number;
  lot_sqm?: number;
  lot_sqft?: number;
  floor_area?: number;
  floor_area_main?: number;
  floor_area_basement?: number;
  floor_area_upper_floors?: number;
  floor_area_unfinished?: number;
  floor_area_total?: number;
  floor_area_below_main?: number;
  floor_area_uom?: 'Feet' | 'Metres';
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
    rooms?: {
      type: string;
      level: string;
      width: string;
      length: string;
    };
  };
  bathroom_details?: {
    baths?: {
      level: string;
      pieces: number;
      ensuite: 'No';
    };
  };
  depth?: number;
  strata_fee?: number;
  frontage?: number;
  frontage_uom?: 'Feet' | 'Metres';
  building_unit?: string;
  total_allowed_rentals?: number;
  total_parking?: number;
  total_covered_parking?: number;
  total_fireplaces?: number;
  floor_levels?: number;
  total_units_in_community?: number;
}
export interface PrivateListingInput extends PrivateListingModel {
  dwelling_type: number;
  amenities?: number[];
  appliances?: number[];
  building_maintenance_items?: number[];
  by_law_restrictions?: number[];
  connected_services?: number[];
  facilities?: number[];
  hvacs?: number[];
  parkings?: number[];
  allowed_pets?: number[];
  places_of_interest?: number[];
  construction_information?: number[];
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
