'use client';

import { classNames } from '@/_utilities/html-helper';
import React, { Children, cloneElement } from 'react';
import RxMapbox from './RxMapbox';
import RxSearchInput from './RxSearchInput';
import styles from './RxPropertyMap.module.scss';
import { Switch } from '@headlessui/react';
import RxPropertyCard from './RxPropertyCard';
import { MapProvider, useMapState } from '@/app/AppContext.module';
import { getPlaceDetails } from '@/_utilities/geocoding-helper';
import { MLSProperty } from '@/_typings/property';
import { PlaceDetails, RxPropertyMapProps } from '@/_typings/maps';
import RxLiveNumber from './RxLiveUrlBased/RxLiveNumber';
import RxLiveNumericStep from './RxLiveUrlBased/RxLiveNumericStep';
import { RxSearchButton } from './RxLiveUrlBased/RxSearchButton';
import RxLiveCurrencyDD from './RxLiveUrlBased/RxLiveCurrencyDD';
import RxLiveStringValue from './RxLiveUrlBased/RxLiveStringValue';

export function RxPropertyMapRecursive(props: RxPropertyMapProps & { className?: string }) {
  let MapAndHeaderHeader;
  let SmallCard;
  let LargeCard;
  const wrappedChildren = Children.map(props.children, child => {
    if (child.type === 'form') {
      return <div className={`${child.props.className || ''} rexified-${child.type}`}>{child.props.children}</div>;
    }
    if (child.type === 'input' && child.props.className && child.props.className.indexOf('search-input-field') >= 0) {
      return (
        <RxSearchInput
          id='search-input'
          name='search-input'
          className={child.props.className}
          onPlaceSelected={(selected_place: google.maps.places.AutocompletePrediction) => {
            props.setPlace && props.setPlace(selected_place);
          }}
        />
      );
    }

    if (child.props) {
      // Map filters
      if (child.props.className) {
        if (child.props.className.indexOf('beds-more') >= 0 || child.props.className.indexOf('beds-less') >= 0) {
          return <RxLiveNumericStep child={child} filter='beds' />;
        }
        if (child.props.className.indexOf('baths-more') >= 0 || child.props.className.indexOf('baths-less') >= 0) {
          return <RxLiveNumericStep child={child} filter='baths' />;
        }
        if (child.props.className.indexOf('beds-min') >= 0) {
          return <RxLiveNumber className={child.props.className} filter='beds' />;
        }
        if (child.props.className.indexOf('baths-min') >= 0) {
          return <RxLiveNumber className={child.props.className} filter='baths' />;
        }

        // Min. price dropdown values
        if (child.props.className.indexOf('dropdown-wrap minprice') >= 0) {
          return <RxLiveCurrencyDD child={child} filter='minprice' className={child.props.className} toggleClassName={props.className} />;
        }
        // Min. price selected value
        if (child.props.className.indexOf('propcard-stat map minprice') >= 0) {
          return <RxLiveStringValue filter='minprice' className={child.props.className} />;
        }

        // Max. price dropdown values
        if (child.props.className.indexOf('dropdown-wrap maxprice') >= 0) {
          return <RxLiveCurrencyDD child={child} filter='maxprice' className={child.props.className} toggleClassName={props.className} />;
        }
        // Max. price selected value
        if (child.props.className.indexOf('propcard-stat map maxprice') >= 0) {
          return <RxLiveStringValue filter='maxprice' className={child.props.className} />;
        }

        // Search  button
        if (child.props.className.indexOf('do-search') >= 0) {
          return <RxSearchButton className={child.props.className}>{child.props.children}</RxSearchButton>;
        }
      }

      if (child.props.children && child.props.children === '{Agent Name}') {
        return <span>{props.agent_data?.full_name}</span>;
      }
    } // End of map filters

    if (child.props && child.props.className && child.props.className.split(' ').includes('property-card-small')) {
      // Just clone one
      SmallCard = cloneElement(child, {
        ...child.props,
        className: classNames(child.props.className, styles.RxPropertyMapSmallCard),
        // Wrap grandchildren too
        children: <>{child.props.children}</>,
      });
      return <>{SmallCard}</>;
    }

    if (child.props && child.props.className === 'mapbox-canvas' && props.config) {
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
                'ml-1 relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
              )}
            >
              <span className='sr-only'>{props.hide_others ? 'Other properties hidden' : 'Showing all properties'}</span>
              <span
                aria-hidden='true'
                className={classNames(
                  props.hide_others ? 'translate-x-4' : '-translate-x-1',
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
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
            className: classNames('right-side', styles.RxPropertyMap),
            // Wrap grandchildren too
            children: (
              <>
                {child.props.children}
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
              </>
            ),
          });

          return MapAndHeaderHeader;
        }

        if (child.props.className === 'property-card-map') {
          // Just clone one
          return child.key === '1' ? (
            props.listings.slice(-10).map((p: MLSProperty, sequence_no) => {
              LargeCard = (
                <RxPropertyCard key={p.MLS_ID} listing={p} sequence={sequence_no}>
                  {cloneElement(child, {
                    ...child.props,
                    className: classNames(child.props.className),
                    // Wrap grandchildren too
                    children: <>{child.props.children}</>,
                  })}
                </RxPropertyCard>
              );
              return LargeCard;
            })
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
          children: <RxPropertyMapRecursive {...props}>{child.props.children}</RxPropertyMapRecursive>,
        },
      );
    }
    return child;
  });
  return <>{wrappedChildren}</>;
}

export default function RxPropertyMap(props: RxPropertyMapProps) {
  const [hide_others, setHideOthers] = React.useState(false);
  const [place, setPlace] = React.useState<google.maps.places.AutocompletePrediction>();
  const [listings, setListings] = React.useState<MLSProperty[]>([]);
  const [map_params, setMapParams] = React.useState<PlaceDetails>();

  React.useEffect(() => {
    if (place && props.agent_data !== undefined) {
      getPlaceDetails(place).then((details: PlaceDetails) => {
        setMapParams(details);
      });
    }
  }, [place, props.agent_data]);

  return (
    <MapProvider>
      <RxPropertyMapRecursive
        {...props}
        setPlace={p => {
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
