import { CreateNeighborhoodMapOptions, MapStyle } from '@/_typings/maps';

/**
 *
 * @param isMobile boolean
 * @returns
 */
export function createNeighborhoodMapOptions(isMobile = false): CreateNeighborhoodMapOptions {
  return {
    clickableIcons: false,
    mapTypeControl: false,
    styles: mapStyles(),
    gestureHandling: isMobile ? 'greedy' : 'cooperative',
  };
}

/**
 *
 * @returns array of MapStyle properties
 */
function mapStyles(): MapStyle[] {
  return [
    {
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      featureType: 'administrative.land_parcel',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#bdbdbd' }],
    },
    {
      featureType: 'administrative.neighborhood',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#eeeeee' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#e5e5e5' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#dadada' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }],
    },
    {
      featureType: 'road.local',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }],
    },
    {
      featureType: 'transit.line',
      elementType: 'geometry',
      stylers: [{ color: '#e5e5e5' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'geometry',
      stylers: [{ color: '#eeeeee' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9c9c9' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }],
    },
  ];
}

const R = 6371;

// offsets in kilometers
const toRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

const toDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

export const getBounds = (lat: number, lng: number, distance: number) => {
  const radius = distance / R;

  const latT = toRadians(lat);
  const lonT = toRadians(lng);

  const deltaLat = radius;
  const deltaLon = Math.asin(Math.sin(radius) / Math.cos(latT));

  const minLat = latT - deltaLat;
  const maxLat = latT + deltaLat;

  const minLon = lonT - deltaLon;
  const maxLon = lonT + deltaLon;

  return {
    nelat: toDegrees(maxLat),
    nelng: toDegrees(maxLon),
    swlat: toDegrees(minLat),
    swlng: toDegrees(minLon),
  };
};
