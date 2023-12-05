'use client';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl, { GeoJSONSource, GeoJSONSourceRaw, Map, MapboxGeoJSONFeature } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Feature } from 'geojson';

import { PropertyDataModel } from '@/_typings/property';
import { addClusterHomeCountLayer, addClusterLayer, addSingleHomePins, createMapPin } from '@/components/RxMapbox';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { useRouter, useSearchParams } from 'next/navigation';
import { objectToQueryString, queryStringToObject } from '@/_utilities/url-helper';

import styles from '@/components/RxMapbox.module.scss';
import { classNames } from '@/_utilities/html-helper';
import { must_not, retrievePublicListingsFromPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import PropertyListModal from '@/components/PropertyListModal';
import { AgentData } from '@/_typings/agent';
import Cookies from 'js-cookie';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import RxPropertyCard from '@/components/RxCards/RxPropertyCard';
import { consoler } from '@/_helpers/consoler';

interface ListingPopupProps {
  id?: string;
  position?: {
    x: number;
    y: number;
  };
  bounds?: {
    height: number;
    width: number;
  };
}
const FILE = 'map-canvas.module.tsx';
const PAGE_SIZE = 100;
function Iterator({ children }: { children: React.ReactElement }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      return (
        <div className={[c.props.className.split('hidden').join(''), 'rexified childof-MapCanvas'].join(' ')}>
          <Iterator>{c.props.children}</Iterator>
        </div>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}
export default function MapCanvas(p: {
  agent?: AgentData;
  className: string;
  children: React.ReactElement;
  properties?: PropertyDataModel[];
  'other-brokers'?: string[];
}) {
  const start = Date.now();
  const router = useRouter();
  const search = useSearchParams();
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const { fireEvent: setClusterModal } = useEvent(Events.MapClusterModal);
  const { data: home_alerts_params, fireEvent: setHomeAlertsParams } = useEvent(Events.MyHomeAlertsForm);
  const { data: lovers_data_obj } = useEvent(Events.LoadLovers);
  const { data: love } = useEvent(Events.MapLoversToggle);
  const { data: agent_only, fireEvent: toggleAgentOnly } = useEvent(Events.AgentMyListings);
  const mapNode = React.useRef(null);
  const [map, setMap] = React.useState<mapboxgl.Map>();
  const [active_marker, setActiveMarker] = useState<PropertyDataModel & { coordinates: mapboxgl.LngLatLike }>();
  const [is_loading, setLoading] = React.useState<boolean>(false);
  const [filters, setFilters] = React.useState<{
    [k: string]: string | number;
  }>(search.toString() ? queryStringToObject(search.toString()) : {});
  const [listings, setListings] = React.useState<PropertyDataModel[]>([]);
  const [pipeline_listings, setPipelineResults] = React.useState<PropertyDataModel[]>([]);
  const [selected_cluster, setSelectedCluster] = React.useState<PropertyDataModel[]>([]);
  const [is_map_loaded, setMapLoaded] = React.useState<boolean>(false);

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
              setClusterModal({
                cluster: feats.map(
                  ({ id, properties }) =>
                    ({
                      ...properties,
                      id,
                    }) as unknown as PropertyDataModel,
                ),
              } as unknown as EventsData);
            });
          } else {
            const listing = properties as unknown as PropertyDataModel;
            // const items: PropertyDataModel[] = [];
            // items.push(properties as unknown as PropertyDataModel);
            // setSelectedCluster(items);
            router.push(`property?mls=${listing.mls_id}`, {});
          }
        }
      });
    }
  };
  let marker: mapboxgl.Marker;

  const registerMapClickHandler = (property_listings: PropertyDataModel[]) => {
    if (!map) return;
    map.off('click', clickEventListener);
    map.on('click', clickEventListener);
  };

  const initializeMap = () => {
    const node = mapNode.current;
    if (typeof window === 'undefined' || node === null) return;
    const { lat, lng, zoom } = filters as unknown as {
      lat: number;
      lng: number;
      zoom: number;
    };
    const m = new mapboxgl.Map({
      container: node,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom || 12,
    });
    m.on('load', () => {
      if (p.properties && p.properties.length) {
        setListings(p.properties);
        setPipelineResults(p.properties);
        setLoading(true);
      }
    });
    setMap(m);
  };

  const populateMap = (search_filters?: { [k: string]: string | number }) => {
    let elastic_filters = {
      ...filters,
      ...search_filters,
    };
    if (elastic_filters && Object.keys(elastic_filters).length) {
      const { beds, baths, minprice, maxprice, minsqft, maxsqft } = elastic_filters;
      const should: {
        match: {
          [key: string]: string | number;
        };
      }[] = Cookies.get('session_key')
        ? [{ match: { 'data.Status': 'Active' } }, { match: { 'data.Status': 'Sold' } }]
        : [{ match: { 'data.Status': 'Active' } }];

      let minimum_should_match = 1;
      checkThenReload(false);
      const user_defined_filters: {
        range?: {
          [k: string]: {
            gte?: number;
            lte?: number;
          };
        };
        term?: {
          [k: string]: string;
        };
        match?: {
          [k: string]: string;
        };
        bool?: {
          should: { match: { [k: string]: string } }[];
          minimum_should_match?: number;
        };
      }[] = [];
      if (baths) {
        user_defined_filters.push({
          range: {
            'data.L_TotalBaths': {
              gte: Number(baths),
            },
          },
        });
      }
      if (beds) {
        user_defined_filters.push({
          range: {
            'data.L_BedroomTotal': {
              gte: Number(beds),
            },
          },
        });
      }
      if (minprice && maxprice) {
        user_defined_filters.push({
          range: {
            'data.AskingPrice': {
              gte: Number(minprice),
              lte: Number(maxprice),
            },
          },
        });
      } else if (minprice) {
        user_defined_filters.push({
          range: {
            'data.AskingPrice': {
              gte: Number(minprice),
            },
          },
        });
      } else if (maxprice) {
        user_defined_filters.push({
          range: {
            'data.AskingPrice': {
              lte: Number(maxprice),
            },
          },
        });
      }
      if (minsqft && maxsqft) {
        user_defined_filters.push({
          range: {
            'data.L_FloorArea_GrantTotal': {
              gte: Number(minsqft),
              lte: Number(maxsqft),
            },
          },
        });
      } else if (minsqft) {
        user_defined_filters.push({
          range: {
            'data.L_FloorArea_GrantTotal': {
              gte: Number(minsqft),
            },
          },
        });
      } else if (maxsqft) {
        user_defined_filters.push({
          range: {
            'data.L_FloorArea_GrantTotal': {
              lte: Number(maxsqft),
            },
          },
        });
      }
      let { types } = filters;
      let q = queryStringToObject(search.toString() || '');

      if (Object.keys(q).length > 0 && q.types) {
        types = q.types;
      }
      if (types) {
        `${types}`.split(',').forEach((t: string) => {
          should.push({
            match: {
              'data.Type': t === 'House' ? 'House/Single Family' : t,
            },
          });
        });
        minimum_should_match = 2;
      }

      if (agent_only?.show && p.agent?.agent_id) {
        const should_match_agents = [
          {
            match: {
              'data.LA1_LoginName': p.agent.agent_id,
            },
          },
          {
            match: {
              'data.LA2_LoginName': p.agent.agent_id,
            },
          },
          {
            match: {
              'data.LA3_LoginName': p.agent.agent_id,
            },
          },
        ];
        if (p['other-brokers']) {
          p['other-brokers'].forEach(agent_id => {
            should_match_agents.push({
              match: {
                'data.LA1_LoginName': agent_id,
              },
            });
            should_match_agents.push({
              match: {
                'data.LA2_LoginName': agent_id,
              },
            });
            should_match_agents.push({
              match: {
                'data.LA3_LoginName': agent_id,
              },
            });
          });
        }

        user_defined_filters.push({
          bool: {
            should: should_match_agents as any,
            minimum_should_match: 1,
          },
        });
      }
      let sort: {
        [key: string]: 'asc' | 'desc';
      } = { 'data.UpdateDate': 'desc' };

      const qs = queryStringToObject(search.toString());
      if (qs.sort) {
        switch (qs.sort) {
          case 'date-asc':
            sort = { 'data.ListingDate': 'asc' };
            break;
          case 'date-desc':
            sort = { 'data.ListingDate': 'desc' };
            break;
          case 'price-asc':
            sort = { 'data.AskingPrice': 'asc' };
            break;
          case 'price-desc':
            sort = { 'data.AskingPrice': 'desc' };
            break;
          case 'size-asc':
            sort = { 'data.L_FloorArea_GrantTotal': 'asc' };
            break;
          case 'size-desc':
            sort = { 'data.L_FloorArea_GrantTotal': 'desc' };
            break;
        }
      }

      if (map) {
        // Let's get more accurate if possible
        // Data bounded by map
        const legacy_params: LegacySearchPayload = {
          from: 0,
          size: PAGE_SIZE,
          sort,
          query: {
            bool: {
              filter: [
                {
                  range: {
                    'data.lat': {
                      lte: map.getBounds().getNorthEast().lat,
                      gte: map.getBounds().getSouthWest().lat,
                    },
                  },
                },
                {
                  range: {
                    'data.lng': {
                      lte: map.getBounds().getNorthEast().lng,
                      gte: map.getBounds().getSouthWest().lng,
                    },
                  },
                },
                {
                  match: {
                    'data.Status': 'Active' as string,
                  },
                } as unknown as Record<string, string>,
              ].concat(user_defined_filters as any[]) as any[],
              should,
              ...(should.length ? { minimum_should_match } : {}),
              must_not,
            },
          },
        };

        setHomeAlertsParams({
          ...home_alerts_params,
          bounds: {
            nelat: map.getBounds().getNorthEast().lat,
            nelng: map.getBounds().getNorthEast().lng,
            swlat: map.getBounds().getSouthWest().lat,
            swlng: map.getBounds().getSouthWest().lng,
          },
        } as unknown as EventsData);

        Promise.all([
          retrievePublicListingsFromPipeline(legacy_params),
          retrievePublicListingsFromPipeline({
            ...legacy_params,
            from: 100,
          }),
          retrievePublicListingsFromPipeline({
            ...legacy_params,
            from: 200,
          }),
          retrievePublicListingsFromPipeline({
            ...legacy_params,
            from: 300,
          }),
          retrievePublicListingsFromPipeline({
            ...legacy_params,
            from: 400,
          }),
        ]).then((results: { records: PropertyDataModel[] }[]) => {
          let all_records: PropertyDataModel[] = [];
          results.forEach(({ records }: { records: PropertyDataModel[] }) => {
            all_records = all_records.concat(records);
          });
          setPipelineResults(all_records);
          const { loved_only } = love as unknown as { loved_only?: boolean };
          if (!loved_only) {
            setListings(all_records);
            checkThenReload(false);
          }
        });
      }
    }
  };

  const checkThenReload = (reload?: boolean) => {
    const { loved_only } = love as unknown as { loved_only?: boolean };
    if (!loved_only) {
      fireEvent({
        ...data,
        reload,
      } as EventsData);
    }
  };

  React.useEffect(() => {
    if (is_map_loaded) {
      const {
        points,
        clicked,
        reload,
        filters: search_filters,
      } = data as unknown as { points: unknown[]; clicked?: string; reload?: boolean; filters?: { [k: string]: string | number } };
      if (map) {
        if (clicked === 'reset') {
          fireEvent({
            ...search_filters,
            points,
          } as unknown as EventsData);
          const updated_filters: {
            [key: string]: string | number;
          } = {
            ...filters,
            lat: map.getCenter().lat,
            lng: map.getCenter().lng,
            nelat: map.getBounds().getNorthEast().lat,
            nelng: map.getBounds().getNorthEast().lng,
            swlat: map.getBounds().getSouthWest().lat,
            swlng: map.getBounds().getSouthWest().lng,
            zoom: map.getZoom(),
          };
          delete updated_filters.types;
        } else if (reload && is_loading === false) {
          setFilters(search_filters as unknown as { [k: string]: string | number });
          populateMap(search_filters as unknown as { [k: string]: string | number });
          setLoading(true);
        }
      }
    }
  }, [is_map_loaded, data, router, search, agent_only]);

  React.useEffect(() => {
    if (map && !is_map_loaded) {
      setMapLoaded(true);
      const nav = new mapboxgl.NavigationControl();
      if (!map.hasControl(nav)) {
        map.addControl(nav, 'bottom-right');
      }
      // marker = new mapboxgl.Marker(createMapPin()).setLngLat(map.getCenter()).addTo(map);

      const populate = (evt: { target: Map }) => {
        // if (marker) marker.remove();

        // marker = new mapboxgl.Marker(createMapPin()).setLngLat(map.getCenter()).addTo(map);

        const { lat, lng } = map.getCenter();
        const { _ne, _sw } = map.getBounds();
        let q = queryStringToObject(search.toString() || '');
        setFilters({
          ...filters,
          ...q,
          lat,
          lng,
          zoom: map.getZoom(),
          nelat: _ne.lat,
          nelng: _ne.lng,
          swlat: _sw.lat,
          swlng: _sw.lng,
        });
      };
      map.off('dragend', populate);
      map.on('dragend', populate);

      map.off('zoomend', populate);
      map.on('zoomend', populate);
    }
    // If we add populateMap into the dependency, it would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, is_map_loaded]);

  // React.useEffect(() => {
  //   if (agent_only?.show !== undefined && agent_only?.show) {
  //     setLoading(true);
  //     consoler(FILE, '[agent_only] changes triggers populateMap', { filters });
  //     populateMap();
  //   }
  // }, [agent_only]);

  React.useEffect(() => {
    setHomeAlertsParams({
      ...home_alerts_params,
      ...filters,
    } as unknown as EventsData);

    if (filters?.lat && filters?.lng) {
      const { reload } = data as unknown as {
        reload: boolean;
      };
      if (!map) {
        initializeMap();
        return;
      } else {
        router.push(`map?${objectToQueryString(filters)}`);
        populateMap();
        return;
      }
      checkThenReload(true);
    }
  }, [map, filters, agent_only]);

  React.useEffect(() => {
    if (listings) {
      const points = listings.map(p => ({
        type: 'Feature' as unknown as Feature,
        properties: {
          type: 'MLSProperty',
          price: getShortPrice(p.asking_price),
          full_price: p.asking_price,
          sqft: p.floor_area,
          ...p,
          area: p.area || p.city,
          photos: [p.cover_photo],
        },
        geometry: {
          coordinates: [p.lon, p.lat],
          type: 'Point',
        } as unknown as GeoJSON.Geometry,
        id: p.mls_id,
      }));

      setLoading(false);
      fireEvent({
        ...data,
        points,
      } as unknown as EventsData);
      const geojson_options: GeoJSONSourceRaw = {
        type: 'geojson',
        data: {
          features: points as unknown as Feature[],
          type: 'FeatureCollection',
        },
        cluster: true,
        clusterMaxZoom: 19,
        clusterRadius: 50,
      };
      if (map) {
        if (map.getSource('map-source') === undefined) {
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

        map.on('mouseenter', 'rx-home-price-bg', e => {
          map.getCanvas().style.cursor = 'pointer';

          // Populate the popup and set its coordinates
          // based on the feature found.
          e.features &&
            e.features.forEach((feature, i) => {
              map.fire('closeAllPopups');
              if (feature.properties && feature.geometry.type === 'Point' && i === 0) {
                // Copy coordinates array.
                const coordinates = feature.geometry.coordinates.slice();
                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                  coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                const listing = feature.properties as unknown as PropertyDataModel;
                setActiveMarker({
                  ...listing,
                  coordinates: coordinates as unknown as mapboxgl.LngLatLike,
                });
              }
            });
        });

        map.on('mouseleave', 'rx-home-price-bg', ev => {
          map.getCanvas().style.cursor = '';
          map.fire('closeAllPopups');
        });

        registerMapClickHandler(listings);
      }
    }
  }, [listings]);

  // React.useEffect(() => {
  //   if (is_loading) {
  //     setLoading(false);
  //     populateMap();
  //   }
  // }, [is_loading]);

  React.useEffect(() => {
    const { loved_only } = love as unknown as { loved_only?: boolean };
    if (loved_only) {
      if (Object.keys(lovers_data_obj as {}).length && Cookies.get('session_key')) {
        const { lovers } = lovers_data_obj as unknown as {
          lovers: PropertyDataModel[];
        };
        setListings(lovers);
      } else {
        const local = (getData(Events.LovedItem) || []) as string[];
        setListings(pipeline_listings.filter(listing => local.includes(listing.mls_id)));
      }
    } else if (loved_only === false) {
      setListings(pipeline_listings);
    }
  }, [love]);

  React.useEffect(() => {
    if (map && active_marker) {
      addPopup(
        map,
        <RxPropertyCard key={active_marker.mls_id} listing={active_marker} sequence={0} agent={p.agent?.id} view-only={false}>
          {React.cloneElement(<div />, {}, <Iterator>{p.children}</Iterator>)}
        </RxPropertyCard>,
        active_marker.coordinates,
      );
    }
  }, [active_marker, map]);

  React.useEffect(() => {
    if (p.properties?.length) {
      toggleAgentOnly({
        show: true,
      });
    }
  }, []);

  return (
    <aside className={[p.className, styles.MainWrapper, 'rexified MapCanvas'].join(' ')}>
      <div id='map' className={classNames(styles.RxMapbox)} ref={mapNode}></div>
      <PropertyListModal
        agent={p.agent}
        card={<Iterator>{p.children}</Iterator>}
        onClose={() => {
          setSelectedCluster([]);
        }}
        view-only={false}
        properties={selected_cluster}
      />
    </aside>
  );
}

function addPopup(map: mapboxgl.Map, el: JSX.Element, coordinates: mapboxgl.LngLatLike) {
  const placeholder = document.createElement('div');
  // mapboxgl requires a fixed height for its popup placement logic
  placeholder.setAttribute('style', 'min-height: 230px');
  const root = createRoot(placeholder);
  root.render(el);

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 20,
  })
    .setDOMContent(placeholder)
    .setLngLat(coordinates)
    .addTo(map);
  popup.addClassName(styles.popup);
  popup.addClassName('');
  popup.setMaxWidth('330px');

  map.on('closeAllPopups', () => {
    popup.remove();
  });
  return popup;
}
