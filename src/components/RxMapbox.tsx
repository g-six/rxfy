'use client';

import React from 'react';
import styles from './RxMapbox.module.scss';
import mapboxgl, { LngLat, LngLatLike, Offset } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { queryStringToObject } from '@/_utilities/url-helper';
import { AgentData } from '@/_typings/agent';
import {
  must_not,
  retrieveFromLegacyPipeline,
} from '@/_utilities/data-helpers/property-page';
import { MLSProperty } from '@/_typings/property';
import { getShortPrice } from '@/_utilities/map-helper';

type RxMapboxProps = {
  agent: AgentData;
  token: string;
  search_url: string;
  headers: Record<string, unknown>;
};

function createClusterPin() {
  const el = document.createElement('div');
  el.className = 'marker';
  el.innerHTML = `<img src="/icons/map/map-pin.svg" width="24" height="24" />`;

  return el;
}

function createMapPin() {
  const el = document.createElement('div');
  el.className = 'marker';
  el.innerHTML = `<img src="/icons/map/map-pin.svg" width="24" height="24" />`;

  return el;
}

function createPropertyPin(property: MLSProperty) {
  const el = document.createElement('div');
  el.className = 'marker';
  console.log('property.AskingPrice', property.AskingPrice);
  el.innerHTML = `<div class="property-map-pin">${getShortPrice(
    property.AskingPrice
  )}</div>`;

  return el;
}

export default function RxMapbox(props: RxMapboxProps) {
  const [map, setMap] = React.useState<mapboxgl.Map>();
  const [properties, setProperties] =
    React.useState<MLSProperty[]>();
  const mapNode = React.useRef(null);

  React.useEffect(() => {
    if (map && properties && properties.length) {
      properties.forEach((p) => {
        const { lat, lng } = p;
        if (lat && lng) {
          new mapboxgl.Marker(createPropertyPin(p))
            .setLngLat([lng, lat])
            .addTo(map);
        }
      });
    }
  }, [map, properties]);

  React.useEffect(() => {
    if (map) {
      const nav = new mapboxgl.NavigationControl();
      map.addControl(nav, 'top-left');

      new mapboxgl.Marker(createMapPin())
        .setLngLat(map.getCenter())
        .addTo(map);

      const sw = map.getBounds().getSouthWest();
      const ne = map.getBounds().getNorthEast();

      retrieveFromLegacyPipeline(
        {
          from: 0,
          size: 500,
          sort: { 'data.ListingDate': 'desc' },
          query: {
            bool: {
              filter: [
                {
                  range: {
                    'data.lat': {
                      gte: sw.lat,
                      lte: ne.lat,
                    },
                  },
                },
                {
                  range: {
                    'data.lng': {
                      gte: sw.lng,
                      lte: ne.lng,
                    },
                  },
                },
              ],
              should: [],
              must_not,
            },
          },
        },
        {
          url: props.search_url,
          headers: props.headers as any,
        }
      ).then((results: MLSProperty[]) => {
        setProperties(results);
      });
    }

    // Markers
    // const markerHeight = 50;
    // const markerRadius = 10;
    // const linearOffset = 25;
    // const popupOffsets: Offset = {
    //   top: [0, 0],
    //   'top-left': [0, 0],
    //   'top-right': [0, 0],
    //   bottom: [0, -markerHeight],
    //   'bottom-left': [
    //     linearOffset,
    //     (markerHeight - markerRadius + linearOffset) * -1,
    //   ],
    //   'bottom-right': [
    //     -linearOffset,
    //     (markerHeight - markerRadius + linearOffset) * -1,
    //   ],
    //   left: [markerRadius, (markerHeight - markerRadius) * -1],
    //   right: [
    //     -markerRadius,
    //     (markerHeight - markerRadius) * -1,
    //   ],
    // };
    // new mapboxgl.Popup({
    //   offset: popupOffsets,
    //   className: 'my-class',
    // })
    //   .setLngLat([Number(params.lng), Number(params.lat)])
    //   .setHTML('<h1>Hello World!</h1>')
    //   .setMaxWidth('300px')
    //   .addTo(map);
  }, [map]);

  React.useEffect(() => {
    const node = mapNode.current;

    if (typeof window === 'undefined' || node === null) return;

    if (window.location.search) {
      const params = queryStringToObject(
        window.location.search.substring(1)
      );
      if (params.lat && params.lng) {
        const mapbox = new mapboxgl.Map({
          container: node,
          accessToken: props.token,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [Number(params.lng), Number(params.lat)],
          zoom: 12,
        });

        setMap(mapbox);

        return () => {
          mapbox.remove();
        };
      }
    }
  }, []);

  return (
    <main className={styles.MainWrapper}>
      <div id='map' className={styles.RxMapbox} ref={mapNode}></div>
    </main>
  );
}

export function convertQueryStringToObject(
  queryString: string
): Record<string, string> {
  const queryPairs = queryString.split('&');
  const queryObject: Record<string, string> = {};

  queryPairs.forEach((pair) => {
    const [key, value] = pair.split('=');
    queryObject[key] = value;
  });

  return queryObject;
}
