import mapboxgl from 'mapbox-gl';

export function renderHomePinBgLayer(id: string, circle_color = '#fff', outline_color = '#5349f0'): mapboxgl.AnyLayer[] {
  return [
    {
      id: `${id}-border`,
      type: 'circle',
      source: 'map-source',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': outline_color,
        'circle-opacity': 0.1,
        'circle-radius': 23,
      },
    },
    {
      id,
      type: 'circle',
      source: 'map-source',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': circle_color,
        'circle-opacity': 1,
        'circle-radius': 20,
      },
    },
  ];
}

export function renderHomePinTextLayer(id: string): mapboxgl.AnyLayer {
  return {
    id,
    type: 'symbol',
    source: 'map-source',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field': '{price}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
    paint: {
      'text-color': '#4f46e5',
    },
  };
}

export function renderClusterBgLayer(id: string): mapboxgl.AnyLayer {
  return {
    id,
    type: 'circle',
    source: 'map-source',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#4f46e5', 5, '#4f46e5', 10, '#4f46e5'],
      'circle-opacity': ['step', ['get', 'point_count'], 0.85, 5, 0.75, 10, 0.68],
      'circle-radius': ['step', ['get', 'point_count'], 12, 5, 16, 10, 18],
    },
  };
}

export function renderClusterTextLayer(id: string): mapboxgl.AnyLayer {
  return {
    id,
    type: 'symbol',
    source: 'map-source',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 14,
    },
    paint: {
      'text-color': '#ffffff',
    },
  };
}
