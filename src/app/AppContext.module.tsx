'use client';
/* eslint-disable react-hooks/exhaustive-deps */
import useDebounce from '@/hooks/useDebounce';
import { MapStatePropsWithFilters } from '@/_typings/property';
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from 'next/navigation';
import React, { Context, createContext, useEffect, useState } from 'react';

// Initial value of context state
const initialState: MapStatePropsWithFilters = {
  query: '',
  reload: false,
  beds: 2,
  baths: 1,
  minprice: 300000,
  maxprice: 20000000,
  maxsqft: 63591,
  city: '',
  agent: '',
  suggestions: [],
};
// Create the Map context
export const MapStateContext: Context<MapStatePropsWithFilters> = createContext(initialState);
export const MapUpdaterContext: Context<any> = createContext((state: MapStatePropsWithFilters, key: string, value: any) => {});

export function useMapState() {
  const map_state = React.useContext(MapStateContext);
  if (typeof map_state === 'undefined') {
    throw new Error('useMapState must be used within a MapProvider');
  }
  return map_state;
}

export function useMapUpdater() {
  const setState = React.useContext(MapUpdaterContext);
  if (typeof setState === 'undefined') {
    throw new Error('useMapUpdater must be used within a MapProvider');
  }
  const update = React.useCallback(
    (map_state: MapStatePropsWithFilters, key: string, value: any) => {
      return setState(() => {
        return {
          ...map_state,
          [key]: value,
        };
      });
    },
    [setState],
  );
  return update;
}

export function useMapMultiUpdater() {
  const setState = React.useContext(MapUpdaterContext);
  if (typeof setState === 'undefined') {
    throw new Error('useMapUpdater must be used within a MapProvider');
  }
  const update = React.useCallback(
    (map_state: MapStatePropsWithFilters, updates: { [key: string]: string | number | boolean | string[] | Date }) => {
      return setState((prev: MapStatePropsWithFilters) => {
        return {
          ...prev,
          ...updates,
        };
      });
    },
    [setState],
  );
  return update;
}

// Create the provider which holds the state
export const MapProvider = (props: any) => {
  const search: ReadonlyURLSearchParams = useSearchParams();
  const router = useRouter();
  let init = initialState;
  const setDefaultQueryKeyValues = () => {
    let query = '?beds=2&baths=1&minprice=750000&maxprice=20000000';
    const child = Array.isArray(props.children) ? props.children[0] : props.children;
    if (child.props.agent_data?.metatags.search_highlights?.length) {
      const default_location = child.props.agent_data.metatags.search_highlights[0];
      query = [
        query,
        `city=${default_location.city}`,
        `lat=${default_location.lat}`,
        `lng=${default_location.lng}`,
        `nelat=${default_location.nelat}`,
        `nelng=${default_location.nelng}`,
        `swlat=${default_location.swlat}`,
        `swlng=${default_location.swlng}`,
        `zoom=${default_location.zoom || 11}`,
        `type=R`,
      ].join('&');
    } else {
      query = [
        query,
        'city=Vancouver',
        'lat=49.20409088889508',
        'lng=-122.97137998744913',
        'nelat=49.3959558143803',
        'nelng=-122.41354488536757',
        'swlat=49.01147862138842',
        'swlng=-123.52921508953003',
        'zoom=10',
        'type=R',
      ].join('&');
    }
    if (typeof window !== 'undefined' && location !== undefined) location.href = query;
  };

  const initializeFilters = () => {
    const keys = ['baths', 'beds', 'minprice', 'maxprice', 'minsqft', 'maxsqft', 'swlat', 'swlng', 'nelat', 'nelng'];
    keys.forEach(key => {
      if (search.get(key)) {
        let value = Number(search.get(key));
        if (!isNaN(value) && value !== undefined) {
          init[key] = value;
        }
      }
    });

    const strings: string[] = ['city', 'agent'];
    strings.forEach(key => {
      if (search.get(key)) {
        let value = search.get(key);
        if (value !== undefined && value !== null) {
          init[key] = value;
        }
      }
    });

    if (search.get('types')) {
      let value: string[] = (search.get('types') as string).split('%2F');
      init.types = value;
    } else {
      init.type = 'R';
    }
  };

  if (search.toString().trim().length === 0) {
    // No map filter params on URL, let's redirect
    setDefaultQueryKeyValues();
  } else {
    initializeFilters();
  }

  const [state, setState] = useState<MapStatePropsWithFilters>(init);
  const debounced = useDebounce(state.address || '', 400);

  useEffect(() => {
    if (debounced && typeof window !== undefined && typeof window.google !== undefined) {
      const svc = new google.maps.places.AutocompleteService();
      const req: google.maps.places.AutocompletionRequest = {
        input: debounced,
        types: ['geocode'],
      };
      svc.getPlacePredictions(req, suggestions => {
        if (suggestions)
          setState({
            ...state,
            suggestions,
          });
      });
    }
  }, [debounced]);

  useEffect(() => {
    if (state.query) {
      const { pathname } = new URL(location.href);
      router.push(`${pathname}?${state.address ? `address=${encodeURIComponent(state.address.replace(/ /g, '+'))}&` : ''}${state.query}`);
    }
  }, [state.query, state.address]);

  return (
    <MapStateContext.Provider value={state}>
      <MapUpdaterContext.Provider value={setState}>{props.children}</MapUpdaterContext.Provider>
    </MapStateContext.Provider>
  );
};

export default MapProvider;
