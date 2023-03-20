'use client';
import styles from './RxMapbox.module.scss';
import React from 'react';
import mapboxgl, {
  GeoJSONSource,
  GeoJSONSourceRaw,
  LngLatLike,
  MapboxGeoJSONFeature,
} from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { queryStringToObject } from '@/_utilities/url-helper';
import { AgentData } from '@/_typings/agent';
import {
  must_not,
  retrieveFromLegacyPipeline,
} from '@/_utilities/data-helpers/property-page';
import { MLSProperty } from '@/_typings/property';
import { getShortPrice } from '@/_utilities/map-helper';
import { Feature } from 'geojson';
import { classNames } from '@/_utilities/html-helper';
import { PlaceDetails } from '@/_utilities/geocoding-helper';
import PropertyListModal from './PropertyListModal';

type RxMapboxProps = {
  agent: AgentData;
  token: string;
  search_url: string;
  params?: PlaceDetails;
  headers: Record<string, unknown>;
};

function createClusterPin(num_of_items: number) {
  const el = document.createElement('div');
  el.className = 'marker';
  el.innerHTML = `<div class="property-map-pin">${getShortPrice(
    num_of_items
  )}</div>`;

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
  el.innerHTML = `<div class="property-map-pin">${getShortPrice(
    property.AskingPrice
  )}</div>`;

  return el;
}

export function RxMapbox(props: RxMapboxProps) {
  const [map_source_id, setMapSourceID] = React.useState(
    `properties-${props.params?.id || 0}`
  );
  const [click_handlers, setClickHandlers] = React.useState<
    string[]
  >([]);
  const [url, setUrl] = React.useState('');
  const [selected_cluster, setSelectedCluster] = React.useState<
    Feature[]
  >([]);
  const [map, setMap] = React.useState<mapboxgl.Map>();
  const [properties, setProperties] =
    React.useState<MLSProperty[]>();
  const mapNode = React.useRef(null);

  const repositionMap = React.useCallback(
    (p?: LngLatLike) => {
      if (map) {
        if (p) {
          map?.setCenter(p);
        }
        new mapboxgl.Marker(createMapPin())
          .setLngLat(map.getCenter())
          .addTo(map);

        const sw = map.getBounds().getSouthWest();
        const ne = map.getBounds().getNorthEast();

        retrieveFromLegacyPipeline(
          {
            from: 0,
            size: 1000,
            sort: { 'data.ListingDate': 'desc' },
            fields: [
              'data.Address',
              'data.Area',
              'data.City',
              'data.AskingPrice',
              'data.L_BedroomTotal',
              'data.L_FloorArea_Total',
              'data.L_TotalBaths',
              'data.photos',
              'data.Status',
              'data.lat',
              'data.lng',
            ],
            _source: false,
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
                  {
                    match: {
                      'data.Status': 'Active',
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
    },
    [map, props.headers, props.search_url]
  );

  React.useEffect(() => {
    if (
      map &&
      properties &&
      properties.length &&
      map.getLayer(
        `properties-${props.params?.id || 0}-clusters`
      ) === undefined
    ) {
      setMapSourceID(`properties-${props.params?.id || 0}`);
      //FeatureCollection<Geometry, GeoJsonProperties>
      const points = properties
        .filter(({ lat, lng }) => {
          return lat !== undefined && lng !== undefined;
        })
        .map((p) => {
          return {
            type: 'Feature' as unknown as Feature,
            properties: {
              type: 'MLSProperty',
              title: p.Address,
              address: p.Address,
              price: getShortPrice(p.AskingPrice),
              full_price: p.AskingPrice,
              area: p.Area || p.City,
              sqft: p.L_FloorArea_Total,
              beds: p.L_BedroomTotal,
              baths: p.L_TotalBaths,
              city: p.City,
              ...p,
            },
            geometry: {
              coordinates: [p.lng, p.lat],
              type: 'Point',
            } as unknown as GeoJSON.Geometry,
            id: p.MLS_ID,
          };
        });

      if (points) {
        const geojson_options: GeoJSONSourceRaw = {
          type: 'geojson',
          data: {
            features: points as unknown as Feature[],
            type: 'FeatureCollection',
          },
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
        };
        if (map.getSource(map_source_id) === undefined) {
          map.addSource(map_source_id, geojson_options);
        }
      }

      if (!click_handlers.includes(map_source_id)) {
        setClickHandlers(click_handlers.concat([map_source_id]));

        map.on('click', (e) => {
          const features = e.target.queryRenderedFeatures(e.point, {
            layers: [
              `${map_source_id}-clusters`,
              `${map_source_id}-unclustered-bg`,
            ],
          });
          if (features) {
            features.forEach(
              ({ properties }: MapboxGeoJSONFeature) => {
                if (properties) {
                  const {
                    cluster_id,
                    point_count,
                    cluster: is_cluster,
                  } = properties;
                  const cluster_source: GeoJSONSource =
                    e.target.getSource(
                      map_source_id
                    ) as GeoJSONSource;

                  // Get children of the cluster
                  // features: Feature<Geometry, GeoJsonProperties>[]

                  if (is_cluster) {
                    cluster_source.getClusterLeaves(
                      cluster_id,
                      point_count,
                      0,
                      (error, feats: Feature[]) => {
                        // Refactor this into a standalone function
                        setSelectedCluster(feats);
                      }
                    );
                  } else {
                    console.log('properties', properties);
                  }
                }
              }
            );
          }
        });
      }

      if (map.getLayer(`${map_source_id}-clusters`) === undefined)
        map.addLayer({
          id: `${map_source_id}-clusters`,
          type: 'circle',
          source: map_source_id,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#4f46e5',
              5,
              '#4f46e5',
              10,
              '#4f46e5',
            ],
            'circle-opacity': [
              'step',
              ['get', 'point_count'],
              0.85,
              5,
              0.75,
              10,
              0.68,
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              12,
              5,
              16,
              10,
              18,
            ],
          },
        });

      if (
        map.getLayer(`${map_source_id}-cluster-count`) === undefined
      )
        map.addLayer({
          id: `${map_source_id}-cluster-count`,
          type: 'symbol',
          source: map_source_id,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': [
              'DIN Offc Pro Medium',
              'Arial Unicode MS Bold',
            ],
            'text-size': 14,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

      if (
        map.getLayer(`${map_source_id}-unclustered-bg`) ===
        undefined
      )
        map.addLayer({
          id: `${map_source_id}-unclustered-bg`,
          type: 'circle',
          source: map_source_id,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#fff',
            'circle-stroke-color': '#5349f0',
            'circle-opacity': 1,
            'circle-radius': 20,
          },
        });

      if (
        map.getLayer(`${map_source_id}-unclustered-point`) ===
        undefined
      )
        map.addLayer({
          id: `${map_source_id}-unclustered-point`,
          type: 'symbol',
          source: map_source_id,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': '{price}',
            'text-font': [
              'DIN Offc Pro Medium',
              'Arial Unicode MS Bold',
            ],
            'text-size': 12,
          },
          paint: {
            'text-color': '#4f46e5',
          },
        });
      else {
      }
    }
  }, [map, properties, map_source_id]);

  React.useEffect(() => {
    if (map) {
      const nav = new mapboxgl.NavigationControl();
      map.addControl(nav, 'top-left');

      repositionMap();
    }
  }, [map]);

  React.useEffect(() => {
    if (props.params && props.params.id) {
      repositionMap([props.params.lng, props.params.lat]);
    }
  }, [props.params, map, repositionMap]);

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

        // onMapLoad(mapbox, 'burnaby');
        setMap(mapbox);

        return () => {
          mapbox.remove();
        };
      }
    }
  }, []);

  //   map.set; TODO

  return (
    <main className={styles.MainWrapper} data-url={url}>
      <div
        id='map'
        className={classNames(
          styles.RxMapbox
          //   is_loading ? 'opacity-40' : ''
        )}
        ref={mapNode}
      ></div>
      <PropertyListModal
        onClose={() => {
          setSelectedCluster([]);
        }}
        properties={selected_cluster}
      />
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

export default React.memo(RxMapbox);
