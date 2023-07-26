'use client';
import React from 'react';
import mapboxgl, { GeoJSONSource, GeoJSONSourceRaw, MapboxGeoJSONFeature } from 'mapbox-gl';
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
import { retrievePublicListingsFromPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import PropertyListModal from '@/components/PropertyListModal';

interface ResidentialListing {
  area: string;
  asking_price: number;
  baths: number;
  beds: number;
  city: string;
  cover_photo: string;
  floor_area: number;
  postal_zip_code: string;
  state_province: string;
  title: string;
  year_built: number;
}

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

export default function MapCanvas(p: { className: string; children: React.ReactElement }) {
  const router = useRouter();
  const search = useSearchParams();
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const mapNode = React.useRef(null);
  const [map, setMap] = React.useState<mapboxgl.Map>();
  const [is_loading, setLoading] = React.useState<boolean>(false);
  const [filters, setFilters] = React.useState<{
    [k: string]: string | number;
  }>();
  const [listings, setListings] = React.useState<PropertyDataModel[]>([]);
  const [selected_cluster, setSelectedCluster] = React.useState<PropertyDataModel[]>([]);

  const { filters: map_filters } = data as unknown as {
    filters: LegacySearchPayload;
  };

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
                    } as unknown as PropertyDataModel),
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
    setMap(
      new mapboxgl.Map({
        container: node,
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [lng, lat],
        zoom: zoom || 12,
      }),
    );
  };

  const populateMap = () => {
    if (filters && is_loading) {
      let should: {
        match?: {
          [k: string]: string;
        };
      }[] = [];
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
      if (filters.types) {
        should = `${filters.types}`.split(',').map(t => ({
          match: {
            'data.Type': t === 'House' ? 'House/Single Family' : t,
          },
        }));
      }
      const legacy_params: LegacySearchPayload = {
        from: 0,
        size: 1000,
        sort: { 'data.UpdateDate': 'desc' },
        query: {
          bool: {
            filter: [
              {
                range: {
                  'data.lat': {
                    lte: filters.nelat,
                    gte: filters.swlat,
                  },
                },
              },
              {
                range: {
                  'data.lng': {
                    lte: filters.nelng,
                    gte: filters.swlng,
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
            ...(should.length ? { minimum_should_match: 1 } : {}),
          },
        },
      };
      retrievePublicListingsFromPipeline(legacy_params).then(({ records }: { records: PropertyDataModel[] }) => {
        setListings(records);
      });
    }
  };

  const repositionMap = React.useCallback(
    () => {
      if (map) {
        // Not sure why we need this, perhaps performance issue in the past?
        // Commenting this out for now and if maps performance is an issue,
        // try uncommenting this

        // map.getStyle().layers.forEach(layer => {
        //   if (layer.id.indexOf('rx-') === 0) {
        //     map.removeLayer(layer.id);
        //   }
        // });
        if (marker) marker.remove();
        marker = new mapboxgl.Marker(createMapPin()).setLngLat(map.getCenter()).addTo(map);

        if (filters) {
          const updated_filters = {
            ...filters,
            lat: map.getCenter().lat,
            lng: map.getCenter().lng,
            nelat: map.getBounds().getNorthEast().lat,
            nelng: map.getBounds().getNorthEast().lng,
            swlat: map.getBounds().getSouthWest().lat,
            swlng: map.getBounds().getSouthWest().lng,
            zoom: map.getZoom(),
          };
          setFilters(updated_filters);
          setLoading(true);
          const qs = objectToQueryString(updated_filters);
          router.push(location.pathname + '?' + qs);
        }
      }
    },
    // If we add populateMap into the dependency, it would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map],
  );

  React.useEffect(() => {
    if (map) {
      const nav = new mapboxgl.NavigationControl();
      if (!map.hasControl(nav)) {
        map.addControl(nav, 'bottom-right');
      }

      const populate = () => {
        repositionMap();
      };
      map.off('dragend', populate);
      map.on('dragend', populate);

      map.off('zoomend', populate);
      map.on('zoomend', populate);
    }
    // If we add populateMap into the dependency, it would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  React.useEffect(() => {
    if (filters?.lat && filters?.lng) {
      const { reload } = data as unknown as {
        reload: boolean;
      };
      if (!map) {
        initializeMap();
        setLoading(true);
      } else if (reload) {
        fireEvent({
          ...data,
          reload: false,
        });
        setLoading(true);
      }
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
    if (search.toString()) {
      setFilters(queryStringToObject(search.toString()));
    }
  }, [search]);

  React.useEffect(() => {
    if (is_loading) {
      setLoading(false);
      populateMap();
    }
  }, [is_loading]);

  return (
    <aside className={[p.className, styles.MainWrapper, 'rexified MapCanvas'].join(' ')}>
      <div id='map' className={classNames(styles.RxMapbox)} ref={mapNode}></div>
      <PropertyListModal
        card={<Iterator>{p.children?.props?.children}</Iterator>}
        onClose={() => {
          setSelectedCluster([]);
        }}
        properties={selected_cluster}
      />
    </aside>
  );
}