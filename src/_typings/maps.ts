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

export interface CreateNeighborhoodMapOptions {
  clickableIcons: false;
  mapTypeControl: false;
  styles: MapStyle[];
  gestureHandling: 'greedy' | 'cooperative';
}
