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

export function getShortPrice(amount: number, prefix = '$') {
  const str = `${Math.round(amount / 1000)}`;
  if (amount < 1000000) {
    return `${prefix}${str}K`;
  }

  if (str.substring(1, 2) !== '0') {
    const x = Math.round(parseInt(str.substring(1), 10) / 100);
    if (x < 10) return `${prefix}${str.substring(0, 1)}.${x}M`;
    else return `${prefix}${str.substring(0, 1)}M`;
  }

  return `${prefix}${Math.round(amount / 1000000)}M`;
}
