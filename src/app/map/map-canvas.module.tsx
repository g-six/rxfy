'use client';
import React from 'react';
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
export default function MapCanvas(p: { agent?: AgentData; className: string; children: React.ReactElement; properties?: PropertyDataModel[] }) {
  const start = Date.now();
  const router = useRouter();
  const search = useSearchParams();
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const { fireEvent: setClusterModal } = useEvent(Events.MapClusterModal);
  const { data: home_alerts_params, fireEvent: setHomeAlertsParams } = useEvent(Events.MyHomeAlertsForm);
  const { data: lovers_data_obj } = useEvent(Events.LoadLovers);
  const { data: love } = useEvent(Events.MapLoversToggle);
  const { data: agent_only } = useEvent(Events.AgentMyListings);
  const mapNode = React.useRef(null);
  const [map, setMap] = React.useState<mapboxgl.Map>();
  const [is_loading, setLoading] = React.useState<boolean>(false);
  const [filters, setFilters] = React.useState<{
    [k: string]: string | number;
  }>();
  const [listings, setListings] = React.useState<PropertyDataModel[]>([]);
  const [pipeline_listings, setPipelineResults] = React.useState<PropertyDataModel[]>([]);
  const [selected_cluster, setSelectedCluster] = React.useState<PropertyDataModel[]>([]);
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
            const items: PropertyDataModel[] = [];
            items.push(properties as unknown as PropertyDataModel);
            setSelectedCluster(items);
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

  const populateMap = (from = 0) => {
    if (filters && is_loading) {
      let should: {
        match?: {
          [k: string]: string;
        };
      }[] = [];
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
      }[] = [];
      if (filters.baths) {
        user_defined_filters.push({
          range: {
            'data.L_TotalBaths': {
              gte: Number(filters.baths),
            },
          },
        });
      }
      if (filters.beds) {
        user_defined_filters.push({
          range: {
            'data.L_BedroomTotal': {
              gte: Number(filters.beds),
            },
          },
        });
      }
      if (filters.minprice && filters.maxprice) {
        user_defined_filters.push({
          range: {
            'data.AskingPrice': {
              gte: Number(filters.minprice),
              lte: Number(filters.maxprice),
            },
          },
        });
      } else if (filters.minprice) {
        user_defined_filters.push({
          range: {
            'data.AskingPrice': {
              gte: Number(filters.minprice),
            },
          },
        });
      } else if (filters.maxprice) {
        user_defined_filters.push({
          range: {
            'data.AskingPrice': {
              lte: Number(filters.maxprice),
            },
          },
        });
      }
      if (filters.minsqft && filters.maxsqft) {
        user_defined_filters.push({
          range: {
            'data.L_FloorArea_GrantTotal': {
              gte: Number(filters.minsqft),
              lte: Number(filters.maxsqft),
            },
          },
        });
      } else if (filters.minsqft) {
        user_defined_filters.push({
          range: {
            'data.L_FloorArea_GrantTotal': {
              gte: Number(filters.minsqft),
            },
          },
        });
      } else if (filters.maxsqft) {
        user_defined_filters.push({
          range: {
            'data.L_FloorArea_GrantTotal': {
              lte: Number(filters.maxsqft),
            },
          },
        });
      }
      let { types } = filters;
      const q = queryStringToObject(search.toString() || '');
      if (Object.keys(q).length > 0 && q.types) {
        types = q.types;
      }
      if (types) {
        should = `${types}`.split(',').map(t => ({
          match: {
            'data.Type': t === 'House' ? 'House/Single Family' : t,
          },
        }));
      }

      if (agent_only?.show && p.agent?.agent_id) {
        should.push({
          match: {
            'data.LA1_LoginName': p.agent.agent_id,
          },
        });
        should.push({
          match: {
            'data.LA2_LoginName': p.agent.agent_id,
          },
        });
        should.push({
          match: {
            'data.LA3_LoginName': p.agent.agent_id,
          },
        });
        minimum_should_match = 2;
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
      // Update query string
      router.push(
        '?' +
          objectToQueryString({
            ...qs,
            lat: filters.lat,
            lng: filters.lng,
            baths: filters.baths || 0,
            beds: filters.beds || 0,
          }),
      );

      if (map) {
        // Let's get more accurate if possible
        // Data bounded by map
        const legacy_params: LegacySearchPayload = {
          from,
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
                    'data.IdxInclude': 'Yes',
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

        // retrievePublicListingsFromPipeline(legacy_params).then(({ records }: { records: PropertyDataModel[] }) => {
        //   setPipelineResults(records);
        //   const { loved_only } = love as unknown as { loved_only?: boolean };
        //   if (!loved_only) {
        //     setListings(records);
        //     checkThenReload(false);
        //   }
        // });
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

  const repositionMap = React.useCallback(
    (latlng: string) => {
      if (map) {
        console.log('Map loaded in', Date.now() - start, 'ms');
        // Not sure why we need this, perhaps performance issue in the past?
        // Commenting this out for now and if maps performance is an issue,
        // try uncommenting this

        // map.getStyle().layers.forEach(layer => {
        //   if (layer.id.indexOf('rx-') === 0) {
        //     map.removeLayer(layer.id);
        //   }
        // });

        let q = queryStringToObject(search.toString() || '');
        if (Object.keys(q).length > 0) {
          const [lat, lng] = latlng.split(',').map(Number);
          const updated_filters = {
            ...q,
            lat,
            lng,
            nelat: map.getBounds().getNorthEast().lat,
            nelng: map.getBounds().getNorthEast().lng,
            swlat: map.getBounds().getSouthWest().lat,
            swlng: map.getBounds().getSouthWest().lng,
            zoom: map.getZoom(),
          };
          setFilters(updated_filters);
          setLoading(true);
          // checkThenReload(true);
        }
      }
    },
    // If we add populateMap into the dependency, it would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map],
  );

  React.useEffect(() => {
    if (data?.clicked === 'reset' && map) {
      fireEvent({
        ...data,
        clicked: undefined,
      });
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
      router.push('?' + objectToQueryString(updated_filters));
    }
  }, [data]);

  React.useEffect(() => {
    if (map) {
      const nav = new mapboxgl.NavigationControl();
      if (!map.hasControl(nav)) {
        map.addControl(nav, 'bottom-right');
      }
      marker = new mapboxgl.Marker(createMapPin()).setLngLat(map.getCenter()).addTo(map);

      const populate = (evt: { target: Map }) => {
        if (marker) marker.remove();

        marker = new mapboxgl.Marker(createMapPin()).setLngLat(map.getCenter()).addTo(map);

        const { lat, lng } = map.getCenter();
        repositionMap(`${lat},${lng}`);
      };
      map.off('dragend', populate);
      map.on('dragend', populate);

      map.off('zoomend', populate);
      map.on('zoomend', populate);

      // setListings(p.properties);
      // setPipelineResults(p.properties);
    }
    // If we add populateMap into the dependency, it would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

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
        if (!p.properties?.length) {
          // SSR Pipeline gathering might have failed or yielded zero results,
          // Let's try calling the /api/pipeline again by setting load - true
          setLoading(true);
        }
        return;
      } else if (reload) {
        setLoading(true);
        return;
      }
      checkThenReload(true);
    }
  }, [filters]);

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
        registerMapClickHandler(listings);
      }
    }
  }, [listings]);

  React.useEffect(() => {
    let q = queryStringToObject(search.toString() || '');
    if (q.center && map) {
      const { center, place_id, ...queryparams } = q;
      const [lat, lng] = `${center}`.split(',').map(Number);
      map.setCenter([lng, lat]);
      map.setZoom(11);
      const updated = {
        ...queryparams,
        lat,
        lng,
        nelat: map.getBounds().getNorthEast().lat,
        swlat: map.getBounds().getSouthWest().lat,
        nelng: map.getBounds().getNorthEast().lng,
        swlng: map.getBounds().getSouthWest().lng,
      };
      setFilters(updated);
      setLoading(true);
    } else if (!q.lat && !q.lng) {
      const updated = {
        lat: Number(search.get('lat')),
        lng: Number(search.get('lng')),
        zoom: 12,
      };
      setFilters(updated);
    } else setFilters(q);
  }, [search]);

  React.useEffect(() => {
    if (is_loading) {
      setLoading(false);
      populateMap();
    }
  }, [is_loading]);

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
    if (agent_only?.show !== undefined) {
      setLoading(true);
      populateMap();
    }
  }, [agent_only]);

  return (
    <aside
      className={[p.className, styles.MainWrapper, 'rexified MapCanvas'].join(' ')}
      style={{
        backgroundImage: `url(${`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${search.get('lng')},${search.get(
          'lat',
        )},12/1080x720@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`})`,
      }}
    >
      <div id='map' className={classNames(styles.RxMapbox)} ref={mapNode}></div>
      <PropertyListModal
        agent={p.agent}
        card={<Iterator>{p.children?.props?.children}</Iterator>}
        onClose={() => {
          setSelectedCluster([]);
        }}
        view-only={false}
        properties={selected_cluster}
      />
    </aside>
  );
}
