/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React from 'react';
import mapboxgl, { GeoJSONSource, GeoJSONSourceRaw, MapboxGeoJSONFeature } from 'mapbox-gl';
import { Feature } from 'geojson';
import styles from './RxMapView.module.scss';
import { LovedPropertyDataModel, PropertyDataModel } from '@/_typings/property';
import { Events, EventsData } from '@/hooks/useFormEvent';
import useEvent from '@/hooks/useEvent';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import { addClusterHomeCountLayer, addClusterLayer, addSingleHomePins } from '@/components/RxMapbox';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { useSearchParams } from 'next/navigation';
import { classNames } from '@/_utilities/html-helper';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { formatAddress } from '@/_utilities/string-helper';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function RxMapView({
  children,
  lat,
  lng,
  properties,
  ...props
}: {
  children: React.ReactElement;
  lat?: number;
  lng?: number;
  className?: string;
  properties?: LovedPropertyDataModel[];
}) {
  const searchParams = useSearchParams();
  const session = useEvent(Events.LoadUserSession);
  const lovers = useEvent(Events.LoadLovers);
  const mapDiv = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<mapboxgl.Map | null>(null);
  const [lat_lng, setLngLat] = React.useState<mapboxgl.LngLatLike>([lng || -123.1207, lat || 49.2827]);
  const [pins, setPins] = React.useState<Feature[]>();
  const [property, setProperty] = React.useState<Feature | undefined>(undefined);

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
              lovers.fireEvent({
                x: e.point.x,
                y: e.point.y,
                selected_pin: feats.map(
                  ({ id, properties }) =>
                    ({
                      ...properties,
                      id,
                    }) as unknown as LovedPropertyDataModel,
                ),
              } as unknown as EventsData);
            });
          } else {
            lovers.fireEvent({
              selected_pin: [properties],
              x: e.point.x,
              y: e.point.y,
            } as unknown as EventsData);
          }
        }
      });
    }
  };

  const attachMap = (setMap: React.Dispatch<React.SetStateAction<any>>, mapDiv: React.RefObject<HTMLDivElement>) => {
    if (!mapDiv.current) return; // initialize map only once
    const m = new mapboxgl.Map({
      container: mapDiv.current || '', // NO ERROR
      style: 'mapbox://styles/mapbox/streets-v12',
      center: lat_lng,
      zoom: 10,
    });
    m.on('idle', () => {
      m.resize();
      // generateMapPoints();
    });
    setMap(m);
  };

  const addPoints = (sources: LovedPropertyDataModel[]) => {
    let minlng: boolean | number = false;
    let maxlng: boolean | number = false;
    let minlat: boolean | number = false;
    let maxlat: boolean | number = false;
    let latitude = 49.2827;
    let longitude = -123.1207;
    const points: Feature[] = [];

    sources.forEach((property: LovedPropertyDataModel) => {
      if (property.lat !== undefined && property.lon !== undefined) {
        if (!minlng || (minlng as number) > property.lon) minlng = property.lon;
        if (!maxlng || (maxlng as number) < property.lon) maxlng = property.lon;
        if (!maxlat || (maxlat as number) < property.lat) maxlat = property.lat;
        if (!minlat || (minlat as number) > property.lat) minlat = property.lat;
        points.push({
          type: 'Feature' as unknown as Feature,
          properties: {
            type: 'MLSProperty',
            price: getShortPrice(property.asking_price),
            full_price: property.asking_price,
            sqft: property.floor_area_total,
            ...property,
            area: property.area || property.city,
          },
          geometry: {
            coordinates: [property.lon, property.lat],
            type: 'Point',
          } as unknown as GeoJSON.Geometry,
          id: property.mls_id,
        } as unknown as Feature);
      }
    });

    if (typeof maxlng === 'number' && typeof minlng === 'number') longitude = (maxlng + minlng) / 2;
    else if (typeof minlng !== 'number' && typeof maxlng === 'number') longitude = maxlng;
    else if (typeof maxlng !== 'number' && typeof minlng === 'number') longitude = minlng;

    if (typeof maxlat === 'number' && typeof minlat === 'number') latitude = (maxlat + minlat) / 2;
    else if (typeof minlat !== 'number' && typeof maxlat === 'number') latitude = maxlat;
    else if (typeof maxlat !== 'number' && typeof minlat === 'number') latitude = minlat;

    setLngLat([longitude, latitude]);
    map?.panTo(lat_lng);
    map?.resize();
    setPins(points);
  };

  React.useEffect(() => {
    if (mapDiv && mapDiv.current && session.data?.clicked) {
      if (!pins) {
        const customer_id = searchParams.get('customer') as unknown as number;
        getLovedHomes(customer_id).then(data => {
          if (data.records) {
            if (data.records && data.records.length) {
              addPoints(data.records);
            }
          }
        });
      } else {
        map?.resize();
      }
    }
  }, [session.data?.clicked]);

  React.useEffect(() => {
    map?.panTo(lat_lng);
  }, [lat_lng]);

  React.useEffect(() => {
    if (map && pins) {
      const geojson_options: GeoJSONSourceRaw = {
        type: 'geojson',
        data: {
          features: pins,
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
          features: pins,
        });
      }
      addClusterLayer(map);
      addClusterHomeCountLayer(map);
      addSingleHomePins(map);
      map.off('click', clickEventListener);
      map.on('click', clickEventListener);
    }
  }, [pins]);

  React.useEffect(() => {
    if (map?.isStyleLoaded() && properties?.length) {
      addPoints(properties);
    }
  }, [map?.isStyleLoaded()]);

  React.useEffect(() => {
    if (lovers.data) {
      const { selected_pin } = lovers.data as unknown as {
        selected_pin?: Feature[];
      };
      if (selected_pin?.length === 1) {
        const [selection] = selected_pin;
        setProperty(selection);
      }
    }
  }, [lovers.data]);

  React.useEffect(() => {
    attachMap(setMap, mapDiv);
  }, []);

  return (
    <section className='w-full h-full relative '>
      <div
        ref={mapDiv}
        key='map'
        {...props}
        className={classNames(props.className || 'no-map-container-class', styles['map-container'])}
        style={{ height: '100%', width: '100%', backgroundImage: 'none' }}
      />
      <Transition
        show={!!property}
        enter='transition-all duration-400'
        enterFrom='opacity-0 bg-black'
        enterTo='opacity-100 left-0 h-full bg-black/30 top-0 w-full absolute'
        leave='transition-all duration-150'
        leaveFrom='opacity-100'
        leaveTo='opacity-0 scale-100'
      >
        {property && (
          <PropertyCard
            className={children.props.className}
            property={property as unknown as PropertyDataModel}
            onClose={() => {
              setProperty(undefined);
            }}
          >
            {children.props.children}
          </PropertyCard>
        )}
      </Transition>
    </section>
  );
}

function PropertyCardIterator({ children, property }: { children: React.ReactElement; property: PropertyDataModel }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.props?.children && typeof c.props?.children !== 'string') {
      if (c.props['data-field'] === 'image_cover') {
        if (property.cover_photo) {
          return React.cloneElement(
            c,
            {
              'data-url': property.cover_photo,
              style: {
                backgroundImage: `url(${property.cover_photo})`,
              },
            },
            <PropertyCardIterator property={property}>{c.props.children}</PropertyCardIterator>,
          );
        }
      }

      return React.cloneElement(c, {}, <PropertyCardIterator property={property}>{c.props.children}</PropertyCardIterator>);
    }

    if (c.props?.['data-field']) {
      const field = c.props?.['data-field'];
      const value = c.props?.['data-field'].includes('address') ? formatAddress(property.title) : formatValues(property, field);
      if (value) {
        return React.cloneElement(c, {}, value);
      }
    }
    return c;
  });

  return <>{Wrapped}</>;
}
function PropertyCard({
  children,
  className,
  onClose,
  property,
}: {
  children: React.ReactElement;
  className?: string;
  onClose(): void;
  property: PropertyDataModel;
}) {
  return (
    <div
      style={{ position: 'absolute', top: '50%', left: '50%' }}
      className={classNames(className || 'no-default-class', '-translate-x-1/2', '-translate-y-1/2')}
    >
      <PropertyCardIterator property={property}>{children}</PropertyCardIterator>
      <button
        type='button'
        className='text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-0 bg-black absolute -top-2 -right-2 z-20 rounded-full w-6 h-6 flex flex-col items-center justify-center'
        onClick={onClose}
      >
        <span className='sr-only'>Close</span>
        <XMarkIcon className='h-4 w-4' aria-hidden='true' />
      </button>
    </div>
  );
}
