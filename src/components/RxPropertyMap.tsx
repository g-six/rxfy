'use client';

import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import React, { Children, cloneElement } from 'react';
import RxMapbox from './RxMapbox';
import RxSearchInput from './RxSearchInput';
import styles from './RxPropertyMap.module.scss';
import { Switch } from '@headlessui/react';
import RxPropertyCard from './RxPropertyCard';
import { MapProvider, useMapState } from '@/app/AppContext.module';
import {
  getPlaceDetails,
  PlaceDetails,
} from '@/_utilities/geocoding-helper';
import { MLSProperty } from '@/_typings/property';

type RxPropertyMapProps = {
  hide_others?: boolean;
  place?: google.maps.places.AutocompletePrediction;
  setPlace?: (p: google.maps.places.AutocompletePrediction) => void;
  listings: MLSProperty[];
  setListings?: (p: MLSProperty[]) => void;
  setHideOthers?: (hide: boolean) => void;
  children: any;
  agent_data: AgentData;
  recursive?: boolean;
  mapbox_params?: PlaceDetails;
  config?: {
    authorization: string;
    url: string;
  };
};

export function RxPropertyMapRecursive(props: RxPropertyMapProps) {
  let MapAndHeaderHeader;
  let SmallCard;
  const wrappedChildren = Children.map(props.children, (child) => {
    if (child.type === 'input') {
      return (
        <RxSearchInput
          id='search-input'
          name='search-input'
          className={child.className}
          onPlaceSelected={(
            selected_place: google.maps.places.AutocompletePrediction
          ) => {
            props.setPlace && props.setPlace(selected_place);
          }}
        />
      );
    }

    if (
      child.type === 'div' &&
      child.props &&
      child.props.children
    ) {
      if (child.props.children === '{Agent Name}') {
        return <span>{props.agent_data?.full_name}</span>;
      }
    }

    if (
      child.props &&
      child.props.className &&
      child.props.className
        .split(' ')
        .includes('property-card-small')
    ) {
      // Just clone one
      SmallCard = cloneElement(child, {
        ...child.props,
        className: classNames(
          child.props.className,
          styles.RxPropertyMapSmallCard
        ),
        // Wrap grandchildren too
        children: <>{child.props.children}</>,
      });
      return <>{SmallCard}</>;
    }

    if (
      child.props &&
      child.props.className === 'mapbox-canvas' &&
      props.config
    ) {
      return (
        <RxMapbox
          agent={props.agent_data}
          headers={{
            Authorization: props.config.authorization,
          }}
          token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string}
          search_url={props.config.url}
          params={props.mapbox_params}
          setListings={(listings: MLSProperty[]) => {
            props.setListings && props.setListings(listings);
          }}
        ></RxMapbox>
      );
    }

    if (child.props && child.props.children) {
      if (child.props.className) {
        if (child.props.className === 'toggle-base') {
          return (
            <Switch
              onChange={props.setHideOthers}
              className={classNames(
                props.hide_others ? 'bg-indigo-600' : 'bg-gray-200',
                'ml-1 relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
              )}
            >
              <span className='sr-only'>
                {props.hide_others
                  ? 'Other properties hidden'
                  : 'Showing all properties'}
              </span>
              <span
                aria-hidden='true'
                className={classNames(
                  props.hide_others
                    ? 'translate-x-4'
                    : '-translate-x-1',
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
          );
        }

        if (
          // child.props.className === 'right-side' &&
          child.props.className === 'mapbox-canvas' &&
          props.config
        ) {
          MapAndHeaderHeader = cloneElement(child, {
            ...child.props,
            className: classNames(
              'right-side',
              styles.RxPropertyMap
            ),
            // Wrap grandchildren too
            children: (
              <>
                {child.props.children}
                <RxMapbox
                  agent={props.agent_data}
                  headers={{
                    Authorization: props.config.authorization,
                  }}
                  token={
                    process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string
                  }
                  search_url={props.config.url}
                  params={props.mapbox_params}
                  setListings={(listings: MLSProperty[]) => {
                    props.setListings &&
                      props.setListings(listings);
                  }}
                ></RxMapbox>
              </>
            ),
          });

          return MapAndHeaderHeader;
        }

        if (child.props.className === 'property-card-map') {
          // Just clone one

          return child.key === '1' ? (
            props.listings
              .slice(-10)
              .map((p: MLSProperty, sequence_no) => (
                <RxPropertyCard
                  key={p.MLS_ID}
                  listing={p}
                  sequence={sequence_no}
                >
                  {cloneElement(child, {
                    ...child.props,
                    className: classNames(child.props.className),
                    // Wrap grandchildren too
                    children: <>{child.props.children}</>,
                  })}
                </RxPropertyCard>
              ))
          ) : (
            <></>
          );
        }
      }
      return cloneElement(
        {
          ...child,
        },
        {
          ...child.props,
          // Wrap grandchildren too
          children: (
            <RxPropertyMapRecursive {...props}>
              {child.props.children}
            </RxPropertyMapRecursive>
          ),
        }
      );
    }
    return child;
  });

  return <>{wrappedChildren}</>;
}

export default function RxPropertyMap(props: RxPropertyMapProps) {
  const [hide_others, setHideOthers] = React.useState(false);
  const [place, setPlace] =
    React.useState<google.maps.places.AutocompletePrediction>();
  const [listings, setListings] = React.useState<MLSProperty[]>([]);
  const [map_params, setMapParams] = React.useState<PlaceDetails>();

  React.useEffect(() => {
    console.log('state changed');
    if (place && props.agent_data !== undefined) {
      getPlaceDetails(place).then((details: PlaceDetails) => {
        setMapParams(details);
      });
    }
  }, [place]);

  return (
    <MapProvider>
      <RxPropertyMapRecursive
        {...props}
        setPlace={(p) => {
          setPlace(p);
        }}
        place={place}
        setListings={(p: MLSProperty[]) => {
          setListings(p);
        }}
        listings={listings}
        setHideOthers={(hide: boolean) => {
          console.log('hide', hide);
          setHideOthers(hide);
        }}
        hide_others={hide_others}
        mapbox_params={map_params}
      ></RxPropertyMapRecursive>
    </MapProvider>
  );
}
