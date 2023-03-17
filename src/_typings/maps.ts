export type MapElementType =
  | 'geometry'
  | 'labels'
  | 'labels.icon'
  | 'labels.text.fill'
  | 'labels.text.stroke'
  | 'geometry';

export type MapFeatureType =
  | 'administrative.land_parcel'
  | 'administrative.neighborhood'
  | 'poi'
  | 'poi.park'
  | 'road'
  | 'road.arterial'
  | 'road.highway'
  | 'road.local'
  | 'transit.line'
  | 'transit.station'
  | 'water';

export interface MapStyle {
  elementType?: MapElementType;
  featureType?: MapFeatureType;
  stylers: Record<string, string>[];
}

export type AddressComponentType =
  | 'administrative_area_level_1'
  | 'administrative_area_level_2'
  | 'country'
  | 'locality'
  | 'neighborhood'
  | 'political'
  | 'postal_code'
  | 'route'
  | 'street_number'
  | 'street_address';

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: AddressComponentType[];
}

export type GeoLocation = {
  lat: number;
  lng: number;
};
export interface Geometry {
  location: GeoLocation;
  location_type: string; // ROOFTOP?
  viewport: {
    northeast: GeoLocation;
    southwest: GeoLocation;
  };
}
export interface Geolocation {
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: Geometry;
  place_id: string;
  types: AddressComponentType[];
}

export interface CreateNeighborhoodMapOptions {
  clickableIcons: false;
  mapTypeControl: false;
  styles: MapStyle[];
  gestureHandling: 'greedy' | 'cooperative';
}

export type MapboxBoundaries = {
  nelat: number;
  nelng: number;
  swlat: number;
  swlng: number;
};
