export const property_info_kv: Record<string, string> = {
  age: 'Age',
  year_built: 'Build Year',
  baths: 'Total Baths',
  beds: 'Total Bedrooms',
  L_Features: 'Features',
  B_Amenities: 'Amenities',
  land_title: 'Title to Land',
  property_type: 'Property Type',
  total_fireplaces: '# of Fireplaces',
  total_kitchens: '# of Kitchens',
  total_parking: 'Total Parking',
  total_covered_parking: 'Covered parking',
  Zoning: 'Zoning',
  heating: 'Fuel/Heating',
};

export const financial_kv: Record<string, string> = {
  gross_taxes: 'Gross taxes',
  mls_id: 'MLS #',
  SoldPrice: 'Sold For',
  price_per_sqft: 'Price per Sqft',
  strata_fee: 'Strata Fee',
  listed_at: 'List Date',
};

export const construction_kv: Record<string, string> = {
  style_type: 'Style of Home',
  construction_information: 'Construction',
  flooring: 'Floor Finish',
  fireplace: 'Fireplace Fueled by',
  foundation_specs: 'Foundation',
  roofing: 'Roof',
  complex_compound_name: 'Complex/Subdivision',
  floor_levels: 'Floor Levels',
};

export interface SoldHistory {
  sold_at_price: number;
  date_sold: string;
  mls_id: string;
}
