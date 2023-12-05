'use client';
import styles from './RxMapbox.module.scss';
import React from 'react';
import mapboxgl, { EventData, GeoJSONSource, GeoJSONSourceRaw, LngLatLike, MapMouseEvent, MapboxGeoJSONFeature } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { queryStringToObject } from '@/_utilities/url-helper';
import { AgentData } from '@/_typings/agent';
import { PropertyAttributeFilters, PropertyDataModel, PropertySortBy } from '@/_typings/property';
import { getSearchPropertyFilters } from '@/_utilities/rx-map-helper';
import { Feature } from 'geojson';
import { classNames } from '@/_utilities/html-helper';
import { MapboxBoundaries, PlaceDetails, RxPropertyFilter } from '@/_typings/maps';
import PropertyListModal from './PropertyListModal';
import { mergeObjects } from '@/_utilities/array-helper';
import { useMapMultiUpdater, useMapState } from '@/app/AppContext.module';
import { useSearchParams } from 'next/navigation';
import { renderClusterBgLayer, renderClusterTextLayer, renderHomePinBgLayer, renderHomePinTextLayer } from '@/_utilities/rx-map-style-helper';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import Cookies from 'js-cookie';
import axios from 'axios';
import { STRAPI_FIELDS, must_not, retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { consoler } from '@/_helpers/consoler';

type RxMapboxProps = {
  agent: AgentData;
  token: string;
  children?: React.ReactElement;
  search_url: string;
  params?: PlaceDetails;
  headers: Record<string, unknown>;
  agent_data?: AgentData;
  setListings(listings: PropertyDataModel[]): void;
};

export function createMapPin() {
  const el = document.createElement('div');
  el.className = 'marker';
  el.innerHTML = `<img src="/icons/map/map-pin.svg" width="24" height="24" class="opacity-60" />`;

  return el;
}

export function addClusterLayer(map: mapboxgl.Map) {
  if (map.getLayer('rx-clusters')) return;
  map.addLayer(renderClusterBgLayer('rx-clusters'));
}

export function addClusterHomeCountLayer(map: mapboxgl.Map) {
  if (map.getLayer('rx-cluster-home-count') === undefined) map.addLayer(renderClusterTextLayer('rx-cluster-home-count'));
}

export function addSingleHomePins(map: mapboxgl.Map) {
  if (map.getLayer('rx-home-price-bg') === undefined) {
    const [outline, bg] = renderHomePinBgLayer('rx-home-price-bg');
    map.addLayer(outline);
    map.addLayer(bg);
  }

  if (map.getLayer('rx-home-price-text') === undefined) {
    map.addLayer(renderHomePinTextLayer('rx-home-price-text'));
  }
}

export function RxMapbox(props: RxMapboxProps) {
  const search = useSearchParams();
  const state = useMapState();
  const updater = useMapMultiUpdater();
  const [selected_cluster, setSelectedCluster] = React.useState<PropertyDataModel[]>([]);
  const [is_loading, setLoading] = React.useState<boolean>(false);
  const [is_reloading, setReloading] = React.useState<boolean>(state.reload || false);
  const [map, setMap] = React.useState<mapboxgl.Map>();
  const [center, setCenter] = React.useState<{ lat: number; lng: number }>();
  const [listings, setPropertyListings] = React.useState<PropertyDataModel[]>([]);
  const mapNode = React.useRef(null);

  const clickEventListener = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
    const features = e.target.queryRenderedFeatures(e.point, {
      layers: ['rx-clusters', 'rx-home-price-bg'],
    });
    if (features) {
      features.forEach(({ properties }: MapboxGeoJSONFeature) => {
        if (properties) {
          const { cluster_id, point_count, cluster: is_cluster } = properties;
          const cluster_source: GeoJSONSource = e.target.getSource('map-source') as GeoJSONSource;

          // Get children of the cluster
          // features: Feature<Geometry, GeoJsonProperties>[]

          if (is_cluster) {
            cluster_source.getClusterLeaves(cluster_id, point_count, 0, (error, feats: Feature[]) => {
              // Refactor this into a standalone function
              setSelectedCluster(
                feats.map(
                  ({ id, properties }) =>
                    ({
                      ...properties,
                      id,
                    }) as unknown as PropertyDataModel,
                ),
              );
            });
          } else {
            const items: PropertyDataModel[] = [];
            items.push(properties as unknown as PropertyDataModel);
            setSelectedCluster(items);
          }
        }
      });
    }
  };

  const populateMap = () => {
    if (!map) return;
    let include_listings = listings;
    // ListingDate

    const { lat: oldlat, lng: oldlng, swlat: oldswlat, swlng: oldswlng, nelat: oldnelat, nelng: oldnelng, ...updated_state } = state;

    search
      .toString()
      .split('&')
      .map(kv => {
        const [k, v] = kv.split('=');
        // We want these fields to be the latest
        if (
          [
            'baths',
            'beds',
            'minprice',
            'maxprice',
            'minsqft',
            'maxsqft',
            'types',
            'lat',
            'lng',
            'swlat',
            'nelat',
            'swlng',
            'nelng',
            'sorting',
            'agent',
          ].includes(k)
        ) {
          updated_state[k] = updated_state[k];
          include_listings = [];
        }
      });

    let q: MapboxBoundaries & PropertyAttributeFilters = {
      ...updated_state,
      swlat: map.getBounds().getSouthWest().lat,
      nelat: map.getBounds().getNorthEast().lat,
      swlng: map.getBounds().getSouthWest().lng,
      nelng: map.getBounds().getNorthEast().lng,
    };

    const filter: RxPropertyFilter[] = getSearchPropertyFilters(q);

    let sort: {
      [key: string]: 'asc' | 'desc';
    }[] = [{ 'data.ListingDate': 'desc' }];
    if (updated_state.sorting) {
      switch (updated_state.sorting) {
        case 'date_asc':
          sort = [
            {
              'data.ListingDate': 'asc',
            },
          ];
          break;
        case PropertySortBy.PRICE_ASC:
          sort = [
            {
              'data.AskingPrice': 'asc',
            },
          ];
          break;
        case PropertySortBy.PRICE_DESC:
          sort = [
            {
              'data.AskingPrice': 'desc',
            },
          ];
          break;
        case 'size_asc':
          sort = [
            {
              'data.L_FloorArea_GrantTotal': 'asc',
            },
          ];
          break;
        case 'size_desc':
          sort = [
            {
              'data.L_FloorArea_GrantTotal': 'desc',
            },
          ];
          break;
      }
    }

    const should: {
      match: {
        [key: string]: string | number;
      };
    }[] = Cookies.get('session_key')
      ? [{ match: { 'data.Status': 'Active' } }, { match: { 'data.Status': 'Sold' } }]
      : [{ match: { 'data.Status': 'Active' } }];

    let minimum_should_match = 1;

    if (q.agent) {
      // Should only retrieve listings by agent id
      should.push({
        match: {
          'data.LA1_LoginName': q.agent,
        },
      });
      should.push({
        match: {
          'data.LA2_LoginName': q.agent,
        },
      });
      should.push({
        match: {
          'data.LA3_LoginName': q.agent,
        },
      });

      // Should match status active OR sold AND LoginName
      minimum_should_match++;
    } else {
    }

    retrieveFromLegacyPipeline(
      {
        from: 0,
        size: 1000,
        sort,
        fields: [
          'data.Address',
          'data.Area',
          'data.City',
          'data.AskingPrice',
          'data.L_BedroomTotal',
          'data.L_FloorArea_GrantTotal',
          'data.L_TotalBaths',
          'data.L_YearBuilt',
          'data.photos',
          'data.Status',
          'data.MLS_ID',
          'data.lat',
          'data.lng',
        ],
        _source: false,
        query: {
          bool: {
            filter,
            should,
            minimum_should_match,
            must_not: must_not.concat([{ match: { 'data.Status': 'Sold' } }]),
          },
        },
      },
      {
        url: props.search_url,
        headers: props.headers as any,
      },
    )
      .then((results: PropertyDataModel[]) => {
        if (window !== undefined) {
          const ne = map.getBounds().getNorthEast();
          const sw = map.getBounds().getSouthWest();
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('lat', `${map.getCenter().lat}`);
          currentUrl.searchParams.set('lng', `${map.getCenter().lng}`);
          currentUrl.searchParams.set('nelat', `${ne.lat}`);
          currentUrl.searchParams.set('nelng', `${ne.lng}`);
          currentUrl.searchParams.set('swlat', `${sw.lat}`);
          currentUrl.searchParams.set('swlng', `${sw.lng}`);
          currentUrl.searchParams.set('zoom', `${map.getZoom()}`);
          window.history.pushState({}, `${ne.lat}${ne.lng}${sw.lat}${sw.lng}`, currentUrl.href);
        }
        if (results.length) {
          setPropertyListings(
            mergeObjects(
              include_listings,
              results.map(listing => {
                let cleaned: {
                  [key: string]: string | number;
                } = {};
                let cover_photo = listing.photos && listing.photos[0];
                if (cover_photo) {
                  cover_photo = getImageSized(cover_photo, 320);
                }
                Object.keys(listing).forEach(k => {
                  if (STRAPI_FIELDS[k])
                    cleaned = {
                      ...cleaned,
                      [STRAPI_FIELDS[k]]: (listing as unknown as { [old: string]: string })[k],
                    } as unknown as {
                      [key: string]: string | number;
                    };
                });

                return {
                  ...cleaned,
                  cover_photo,
                };
              }),
              'mls_id',
            ),
          );
        } else {
          setPropertyListings([]);
        }

        setLoading(false);
      })
      .finally(() => {
        updater(updated_state, {
          is_loading: false,
          reload: false,
        });
      });
  };

  const registerMapClickHandler = (property_listings: PropertyDataModel[]) => {
    if (!map) return;
    map.off('click', clickEventListener);
    map.on('click', clickEventListener);
  };

  const repositionMap = React.useCallback(
    (p?: LngLatLike) => {
      if (map && !is_loading) {
        if (p) {
          map.getStyle().layers.forEach(layer => {
            if (layer.id.indexOf('rx-') === 0 || layer.type === 'symbol') map.removeLayer(layer.id);
          });

          map.setCenter(p);
        }

        new mapboxgl.Marker(createMapPin()).setLngLat(map.getCenter()).addTo(map);
        axios
          .get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${map.getCenter().lng},${
              map.getCenter().lat
            }.json?types=address&access_token=pk.eyJ1IjoianNjYXN0cm8iLCJhIjoiY2s2YzB6Z25kMDVhejNrbXNpcmtjNGtpbiJ9.28ynPf1Y5Q8EyB_moOHylw`,
          )
          .then(new_center => {
            if (!new_center?.data?.features) return;

            // Reverse geocoding
            const ctx_geo = new_center.data.features[0].context as {
              id: string;
              text: string;
            }[];

            if (ctx_geo) {
              const currentUrl = new URL(window.location.href);
              const [neighbourhood] = ctx_geo.filter(ctx_item => ctx_item.id.indexOf('neighborhood') >= 0);
              const [place] = ctx_geo.filter(ctx_item => ctx_item.id.indexOf('place') >= 0);
              let place_param = '';
              const zoom = Number(currentUrl.searchParams.get('zoom'));

              if (!isNaN(zoom) && zoom <= 12) {
                place_param = neighbourhood?.text || place?.text;
              } else {
                place_param = place?.text || neighbourhood?.text;
              }

              currentUrl.searchParams.set('city', place_param);
              window.history.pushState({}, `${map.getCenter().lat}${map.getCenter().lng}${place_param}`, currentUrl.href);
              updater(state, {
                city: place_param,
              });
            }
          });
        populateMap();
      }
    },
    // If we add populateMap into the dependency, it would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map, is_loading],
  );

  React.useEffect(() => {
    if (state.is_loading) {
      let lat, lng;
      setPropertyListings([]);
      let updates = {};
      search
        .toString()
        .split('&')
        .filter(kv => kv.indexOf('lat=') === 0 || kv.indexOf('lng=') === 0)
        .map(kv => {
          const [k, v] = kv.split('=');
          if (k === 'lat') lat = Number(v);
          if (k === 'lng') lng = Number(v);
          if (['baths', 'beds', 'minprice', 'maxprice'].includes(k)) {
            updates = {
              ...updates,
              [k]: Number(v),
            };
          }
        });

      updater(state, {
        is_loading: false,
        reload: false,
      });
      if (typeof lat !== 'undefined' && typeof lng !== 'undefined') {
        repositionMap([lng, lat]);
      }
    }
  }, [state.is_loading]);

  React.useEffect(() => {
    if (map) {
      const nav = new mapboxgl.NavigationControl();
      // map.addControl(nav, 'bottom-right');
      const populate = () => {
        setLoading(true);
        populateMap();
      };
      map.off('dragend', populate);
      map.on('dragend', populate);

      map.off('zoomend', populate);
      map.on('zoomend', populate);

      setLoading(true);
      populateMap();
    }
    // If we add populateMap into the dependency, it would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  React.useEffect(() => {
    setReloading(false);
    if (is_reloading) {
      // When filters are updated, we wanna repop
      setLoading(true);
      populateMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is_reloading]);

  React.useEffect(() => {
    if (state.reload) {
      setReloading(true);
    }
  }, [state.reload]);

  React.useEffect(() => {
    if (props.params && props.params.id) {
      updater(state, {
        lat: props.params.lat,
        lng: props.params.lng,
      });
      if (center?.lat !== props.params.lat && center?.lng !== props.params.lng) {
        setCenter({
          lat: props.params.lat,
          lng: props.params.lng,
        });
      }
      //
    }
  }, [props.params]);

  React.useEffect(() => {
    if (center && center.lng && center.lat) {
      repositionMap([center.lng, center.lat]);
    }
  }, [center]);

  React.useEffect(() => {
    if (Array.isArray(listings)) {
      const points = listings
        .filter(({ lat, lon }) => {
          return lat !== undefined && lon !== undefined;
        })
        .map(p => {
          return {
            type: 'Feature' as unknown as Feature,
            properties: {
              type: 'MLSProperty',
              price: getShortPrice(p.asking_price),
              full_price: p.asking_price,
              sqft: p.floor_area_total,
              ...p,
              area: p.area || p.city,
              photos: p.photos,
            },
            geometry: {
              coordinates: [p.lon, p.lat],
              type: 'Point',
            } as unknown as GeoJSON.Geometry,
            id: p.mls_id,
          };
        });

      if (points && map) {
        const geojson_options: GeoJSONSourceRaw = {
          type: 'geojson',
          data: {
            features: points as unknown as Feature[],
            type: 'FeatureCollection',
          },
          cluster: true,
          clusterMaxZoom: 19, // Max zoom to cluster points on
          clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
        };

        if (map && map.getSource('map-source') === undefined) {
          map.addSource('map-source', geojson_options);
        } else {
          (map.getSource('map-source') as GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: points as unknown as Feature[],
          });
        }
        addClusterLayer(map);
        addClusterHomeCountLayer(map);
        addSingleHomePins(map);
        registerMapClickHandler(listings);
      }
    }

    props.setListings(listings);
  }, [listings]);

  React.useEffect(() => {
    const node = mapNode.current;

    if (typeof window === 'undefined' || node === null) return;

    if (window.location.search) {
      const params = queryStringToObject(window.location.search.substring(1));
      if (params.lat && params.lng) {
        const mapbox = new mapboxgl.Map({
          container: node,
          accessToken: props.token,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [Number(params.lng), Number(params.lat)],
          zoom: (params.zoom as unknown as number) || 12,
        });

        setMap(mapbox);
        const nav = new mapboxgl.NavigationControl();
        mapbox.addControl(nav, 'bottom-right');
        setLoading(true);
        populateMap();

        return () => {
          mapbox.remove();
        };
      }
    }
  }, []);

  return (
    <main className={classNames(styles.MainWrapper, 'mapbox-canvas')}>
      <div
        id='map'
        className={classNames(
          styles.RxMapbox,
          //   is_loading ? 'opacity-40' : ''
        )}
        ref={mapNode}
      ></div>
      <PropertyListModal
        card={props.children}
        agent={props.agent}
        onClose={() => {
          setSelectedCluster([]);
        }}
        properties={selected_cluster}
      />
    </main>
  );
}

export function convertQueryStringToObject(queryString: string): Record<string, string> {
  const queryPairs = queryString.split('&');
  const queryObject: Record<string, string> = {};

  queryPairs.forEach(pair => {
    const [key, value] = pair.split('=');
    queryObject[key] = value;
  });

  return queryObject;
}

export default React.memo(RxMapbox);
