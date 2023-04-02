import { AgentData } from './agent';
import { MLSProperty } from './property';

export type MapElementType = 'geometry' | 'labels' | 'labels.icon' | 'labels.text.fill' | 'labels.text.stroke' | 'geometry';

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

export interface PlaceDetails {
  id: number;
  name: string;
  lat: number;
  lng: number;
  ne_lat: number;
  ne_lng: number;
  sw_lat: number;
  sw_lng: number;
  zoom: number;
  title: string;
  agent: number;
  place_id: string;
  province_state: string;
  metroarea: string;
  country: string;
  postal_code: string;
  route: string;
  street_number: string;
  formatted_address: string;
  vicinity: string;
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

export type RxPropertyMapProps = {
  type?: string;
  hide_others?: boolean;
  place?: google.maps.places.AutocompletePrediction;
  setPlace?: (p: google.maps.places.AutocompletePrediction) => void;
  listings: MLSProperty[];
  setListings?: (p: MLSProperty[]) => void;
  setHideOthers?: (hide: boolean) => void;
  children: any;
  agent_data: AgentData;
  recursive?: boolean;
  mapbox_params?: PlaceDetails;
  config?: {
    authorization: string;
    url: string;
  };
};
