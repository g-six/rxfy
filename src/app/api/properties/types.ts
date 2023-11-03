export enum FIELD_CATEGORY {
  Appliance = 'Appliance',
  Construction = 'Construction Material',
  Flooring = 'Flooring',
  Parking = 'Parking',
  Window = 'Window',
}

export type LegacyPipelineFields =
  | 'B_Amenities'
  | 'B_Construction'
  | 'B_ConstructionMaterials'
  | 'B_Exterior_Finish'
  | 'B_Heating'
  | 'B_Maintenance_Includes'
  | 'B_OutdoorArea'
  | 'B_Parking_Access'
  | 'B_Parking_Type'
  | 'B_ServicesConnected'
  | 'B_WaterSupply'
  | 'L_Appliances'
  | 'L_Features'
  | 'L_Fireplaces'
  | 'L_PetsAllowed'
  | 'L_Cats'
  | 'L_Dogs'
  | 'L_LaundyFeatures'
  | 'L_OtherStructures'
  | 'L_ParkingFeatures'
  | 'L_Parking_covered'
  | 'L_Parking_total'
  | 'L_Exterior Features'
  | 'L_Sewer'
  | 'L_StrataLotsIncludes'
  | 'L_Floor_Finish'
  | 'L_Locker'
  | 'L_WindowFeatures'
  | 'L_WaterSource'
  | 'L_YearBuilt'
  | 'LFD_Amenities_56'
  | 'LFD_Construction_41'
  | 'LFD_FeaturesIncluded_55'
  | 'LFD_FloorFinish_50'
  | 'LFD_FuelHeating_48'
  | 'LFD_OutdoorArea_47'
  | 'LFD_MaintFeeIncludes_57'
  | 'LFD_Parking_44'
  | 'LFD_ParkingAccess_45'
  | 'LFD_ServicesConnected_7'
  | 'LFD_SiteInfluences_46'
  | 'LFD_WaterSupply_8';

export type PropertyRelationships =
  | 'amenities'
  | 'appliances'
  | 'build_features'
  | 'connected_services'
  | 'facilities'
  | 'hvac'
  | 'parking'
  | 'pets_allowed'
  | 'places_of_interest'
  | 'items_maintained';

export const AMENITY_RELATED_FIELDS: LegacyPipelineFields[] = [
  'B_Amenities',
  'B_OutdoorArea',
  'LFD_Amenities_56',
  'L_Features',
  'LFD_OutdoorArea_47',
  'L_Exterior Features',
  'LFD_FeaturesIncluded_55',
  'L_Locker',
];

export const APPLIANCE_RELATED_FIELDS: LegacyPipelineFields[] = ['L_Features', 'LFD_FeaturesIncluded_55'];
export const POI_FIELDS: LegacyPipelineFields[] = ['LFD_SiteInfluences_46'];

export const BUILD_RELATED_FIELDS: LegacyPipelineFields[] = [
  'B_Construction',
  'B_ConstructionMaterials',
  'B_Exterior_Finish',
  'L_Floor_Finish',
  'L_WindowFeatures',
  'LFD_Construction_41',
  'LFD_FloorFinish_50',
];

export const FACILITY_RELATED_FIELDS: LegacyPipelineFields[] = ['L_Features', 'L_OtherStructures', 'LFD_MaintFeeIncludes_57'];
export const FLOORING_RELATED_FIELDS: LegacyPipelineFields[] = ['L_Floor_Finish', 'LFD_FloorFinish_50'];
export const PARKING_RELATED_FIELDS: LegacyPipelineFields[] = ['B_Parking_Access', 'B_Parking_Type', 'LFD_Parking_44', 'LFD_ParkingAccess_45'];

export const HVAC_RELATED_FIELDS: LegacyPipelineFields[] = [
  'B_Heating',
  'B_Amenities',
  'LFD_FuelHeating_48',
  'LFD_MaintFeeIncludes_57',
  'LFD_FeaturesIncluded_55',
];
export const WATER_SUPPLY_RELATED_FIELDS: LegacyPipelineFields[] = ['B_WaterSupply', 'L_WaterSource', 'LFD_WaterSupply_8'];

export const SERVICES_RELATED_FIELDS: LegacyPipelineFields[] = [
  'B_Maintenance_Includes',
  'B_ServicesConnected',
  'L_Exterior Features',
  'L_Sewer',
  'LFD_ServicesConnected_7',
  'B_WaterSupply',
  'L_WaterSource',
  'LFD_FeaturesIncluded_55',
  'LFD_WaterSupply_8',
  'LFD_MaintFeeIncludes_57',
];

export type KeyValuePair = {
  id: number;
  name: string;
};
export type PropertyAttributes = {
  amenities?: KeyValuePair[];
  appliances?: KeyValuePair[];
  build_features?: KeyValuePair[];
  connected_services?: KeyValuePair[];
  facilities?: KeyValuePair[];
  hvac?: KeyValuePair[];
  items_maintained?: KeyValuePair[];
  parking?: KeyValuePair[];
  pets_allowed?: KeyValuePair[];
  places_of_interest?: KeyValuePair[];
  real_estate_board?: KeyValuePair[];
};

export type BuildingUnit = {
  mls_id: string;
  title: string;
  beds: number;
  baths: number;
  floor_area: number;
  asking_price: number;
  id: number;
};
