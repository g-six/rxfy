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
      return setState(() => {
        return {
          ...map_state,
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
    if (props.children.props.agent_data?.metatags.search_highlights?.labels) {
      const default_location = props.children.props.agent_data.metatags.search_highlights.labels[0];
      query = [
        query,
        `lat=${default_location.lat}`,
        `lng=${default_location.lng}`,
        `nelat=${default_location.ne.lat}`,
        `nelng=${default_location.ne.lng}`,
        `swlat=${default_location.sw.lat}`,
        `swlng=${default_location.sw.lng}`,
        `zoom=${default_location.zoom}`,
        `type=R`,
      ].join('&');
    } else {
      query = [
        query,
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
    location.href = query;
  };

  const initializeFilters = () => {
    if (search.get('baths')) {
      let value = Number(search.get('baths'));
      if (!isNaN(value)) {
        init.baths = value;
      }
    }
    if (search.get('beds')) {
      let value = Number(search.get('beds'));
      if (!isNaN(value)) init.beds = value;
    }
    if (search.get('minprice')) {
      let value = Number(search.get('minprice'));
      if (!isNaN(value)) init.minprice = value;
    }
    if (search.get('maxprice')) {
      let value = Number(search.get('maxprice'));
      if (!isNaN(value)) init.maxprice = value;
    }
    if (search.get('minsqft')) {
      let value = Number(search.get('minsqft'));
      if (!isNaN(value)) init.minsqft = value;
    }
    if (search.get('maxsqft')) {
      let value = Number(search.get('maxsqft'));
      if (!isNaN(value)) init.maxsqft = value;
    }
    if (search.get('lat')) {
      let value = Number(search.get('lat'));
      if (!isNaN(value)) init.lat = value;
    }
    if (search.get('lng')) {
      let value = Number(search.get('lng'));
      if (!isNaN(value)) init.lng = value;
    }
    if (search.get('swlat')) {
      let value = Number(search.get('swlat'));
      if (!isNaN(value)) init.swlat = value;
    }
    if (search.get('swlng')) {
      let value = Number(search.get('swlng'));
      if (!isNaN(value)) init.swlng = value;
    }
    if (search.get('nelat')) {
      let value = Number(search.get('nelat'));
      if (!isNaN(value)) init.nelat = value;
    }
    if (search.get('nelng')) {
      let value = Number(search.get('nelng'));
      if (!isNaN(value)) init.nelng = value;
    }
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
      router.push(`/map?${state.address ? `address=${encodeURIComponent(state.address.replace(/ /g, '+'))}&` : ''}${state.query}`);
    }
  }, [state.query, state.address]);

  return (
    <MapStateContext.Provider value={state}>
      <MapUpdaterContext.Provider value={setState}>{props.children}</MapUpdaterContext.Provider>
    </MapStateContext.Provider>
  );
};

export default MapProvider;
