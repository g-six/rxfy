'use client';
import axios from 'axios';
import React, { Children, cloneElement } from 'react';
import { classNames } from '@/_utilities/html-helper';
import RxMapbox from './RxMapbox';
import RxSearchInput from './RxSearchInput';
import styles from './RxPropertyMap.module.scss';
import { Switch } from '@headlessui/react';
import RxPropertyCard from '@/components/RxCards/RxPropertyCard';
import { MapProvider } from '@/app/AppContext.module';
import { getPlaceDetails } from '@/_utilities/geocoding-helper';
import { LovedPropertyDataModel, MLSProperty } from '@/_typings/property';
import { PlaceDetails, RxPropertyMapProps } from '@/_typings/maps';
import HomeAlertsReplacer from '@/_replacers/HomeAlerts/home-alerts';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { RxUserSessionLink } from './Nav/RxUserSessionLink';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { LoveDataModel } from '@/_typings/love';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import { Events } from '@/_typings/events';
import RxNavItemMenu from './Nav/RxNavItemMenu';
import RxSearchFilters from './RxPropertyMap/RxSearchFilters';
import RxToggleSavedHomes from './RxPropertyMap/RxToggleSavedHomes';

export function RxPropertyMapRecursive(props: RxPropertyMapProps & { className?: string }) {
  let MapAndHeaderHeader;
  let SmallCard;
  let LargeCard;
  const wrappedChildren = Children.map(props.children, child => {
    if (child.type === 'form') {
      return (
        <RxPropertyMapRecursive
          setPlace={props.setPlace}
          listings={props.listings}
          loved_homes={props.loved_homes || []}
          agent_data={props.agent_data}
          type='div'
          className={`${child.props.className || ''} rexified-${child.type}`}
        >
          {child.props.children}
        </RxPropertyMapRecursive>
      );
    }
    if (child.props && child.props.className && child.props.className.split(' ').includes(WEBFLOW_NODE_SELECTOR.HOME_ALERTS_WRAPPER)) {
      return <HomeAlertsReplacer agent={props.agent_data} nodeClassName='absolute' nodeProps={child.props} nodes={child.props.children} />;
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
      // Map filters or Header Nav
      if (child.props.className) {
        if (child.props.className.indexOf('nav-menu-list-wrapper') >= 0 || child.props.className.indexOf('login-logout-dropdown') >= 0) {
          return <RxNavItemMenu {...child.props}>{child.props.children}</RxNavItemMenu>;
        } else if (child.props.className.split(' ').includes('map-filters')) {
          return <RxSearchFilters className={child.props.className || ''}>{child.props.children}</RxSearchFilters>;
        } else if (child.props.className.split(' ').includes('heart-button')) {
          return (
            <RxToggleSavedHomes {...child.props} onClick={props.toggleLovedHomes}>
              {child.props.children}
            </RxToggleSavedHomes>
          );
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
        >
          {child.props.children}
        </RxMapbox>
      );
    }

    if (child.props && child.props.children) {
      if (child.props.className) {
        if (child.props.className === 'left-bar') {
          child.props.className = `${styles.LeftBar} ${child.props.className} md:max-h-screen max-h-[calc(100dvh_-_6rem)]`;
        }
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

        if (child.props.className.indexOf('property-card') >= 0) {
          // Just clone one
          return child.key === '1' ? (
            props.listings.slice(0, 100).map((p: MLSProperty, sequence_no) => {
              const record = props.loved_homes?.filter(({ mls_id }) => mls_id === p.MLS_ID).pop();
              LargeCard = (
                <RxPropertyCard key={p.MLS_ID} love={record?.love} listing={p} sequence={sequence_no} agent={props.agent_data.id}>
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

        if (
          child.props.className.split(' ').includes(WEBFLOW_NODE_SELECTOR.USER_MENU) ||
          child.props.className.split(' ').includes(WEBFLOW_NODE_SELECTOR.GUEST_MENU)
        ) {
          return (
            <RxUserSessionLink {...child.props} className={child.props.className} href={child.props.href}>
              <>{child.props.children}</>
            </RxUserSessionLink>
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
  const [show_loved, toggleLovedHomes] = React.useState(false);
  const [hide_others, setHideOthers] = React.useState(false);
  const [place, setPlace] = React.useState<google.maps.places.AutocompletePrediction>();
  const [listings, setListings] = React.useState<MLSProperty[]>([]);
  const [loved_homes, setLovedHomes] = React.useState<LovedPropertyDataModel[]>([]);
  const [map_params, setMapParams] = React.useState<PlaceDetails>();

  const processLovedHomes = (records: LoveDataModel[]) => {
    const local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
    const loved: LovedPropertyDataModel[] = [];
    records.forEach(({ id, property }) => {
      loved.push({
        ...property,
        love: id,
      });
      if (!local_loves.includes(property.mls_id)) {
        local_loves.push(property.mls_id);
      }
    });
    setLovedHomes(loved);
    setData(Events.LovedItem, JSON.stringify(local_loves));
  };

  React.useEffect(() => {
    if (place && props.agent_data !== undefined) {
      getPlaceDetails(place).then((details: PlaceDetails) => {
        setMapParams(details);
      });
    }
  }, [place, props.agent_data]);

  React.useEffect(() => {
    if (props.hide_others) {
      axios.get();
    }
  }, [props.hide_others]);

  React.useEffect(() => {
    getLovedHomes().then(response => {
      if (response && response.records) {
        processLovedHomes(response.records);
      }
    });
  }, []);

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
        listings={listings.filter(listing => {
          if (show_loved) {
            const local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
            return local_loves.includes(listing.MLS_ID);
          }
          return true;
        })}
        loved_homes={loved_homes}
        setHideOthers={(hide: boolean) => {
          setHideOthers(hide);
        }}
        toggleLovedHomes={() => {
          toggleLovedHomes(!show_loved);
          console.log(loved_homes);
        }}
        hide_others={hide_others}
        mapbox_params={map_params}
      ></RxPropertyMapRecursive>
    </MapProvider>
  );
}
