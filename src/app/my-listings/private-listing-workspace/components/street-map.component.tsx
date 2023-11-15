'use client';
import mapboxgl, { GeoJSONSource, GeoJSONSourceRaw, Map, MapboxGeoJSONFeature } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LatLng } from '@/_typings/agent-my-listings';
import { createNeighborhoodMapOptions } from '@/_utilities/map-helper';
import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { createMapPin } from '@/components/RxMapbox';

export default function MyListingStreetMap({ lon, lat, ...props }: { lon: number; lat: number }) {
  const mapNode = useRef(null);
  const [map, setMap] = useState<mapboxgl.Map>();
  let marker: mapboxgl.Marker;
  const initializeMap = () => {
    const node = mapNode.current;
    if (typeof window === 'undefined' || node === null) return;

    const m = new mapboxgl.Map({
      container: node,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lon, lat],
      zoom: 13,
    });
    m.on('idle', function () {
      m.resize();
      document.querySelector('aside .tab-address')?.addEventListener('click', () => {
        setTimeout(() => {
          m.resize();
        }, 600);
      });
      document.querySelector('aside .tab-neighborhood')?.addEventListener('click', () => {
        setTimeout(() => {
          m.resize();
        }, 600);
      });
    });
    setMap(m);
  };

  useEffect(() => {
    if (map) {
      const nav = new mapboxgl.NavigationControl();
      if (!map.hasControl(nav)) {
        map.addControl(nav, 'bottom-right');
      }
      marker = new mapboxgl.Marker(createMapPin()).setLngLat(map.getCenter()).addTo(map);
    }
  }, [map]);

  useEffect(() => {
    initializeMap();
  }, []);

  return <div {...props} id='map' ref={mapNode} style={{ minWidth: '432px', minHeight: '320px' }} />;
}
