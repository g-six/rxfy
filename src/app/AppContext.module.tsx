'use client';
/* eslint-disable react-hooks/exhaustive-deps */
import useDebounce from '@/hooks/useDebounce';
import { PlaceDetails } from '@/_typings/maps';
import { getPlaceDetails } from '@/_utilities/geocoding-helper';
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from 'next/navigation';
import React, { Context, createContext, useEffect, useState } from 'react';

// Initial value of context state
interface BaseKeyValuePairStateProps {
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | google.maps.places.AutocompletePrediction
    | google.maps.places.AutocompletePrediction[]
    | PlaceDetails
    | string[];
}
export interface MapStateProps extends BaseKeyValuePairStateProps {
  is_loading?: boolean;
  reload?: boolean;
  query: string;
  ptype?: string[];
  beds?: number;
  baths?: number;
  minprice?: number;
  maxprice?: number;
  minsqft?: number;
  maxsqft?: number;
  place?: google.maps.places.AutocompletePrediction;
  suggestions: google.maps.places.AutocompletePrediction[];
  details?: PlaceDetails;
}
const initialState: MapStateProps = {
  query: '',
  reload: false,
  beds: 2,
  baths: 1,
  minprice: 300000,
  maxprice: 20000000,
  suggestions: [],
};
// Create the Map context
export const MapStateContext: Context<MapStateProps> = createContext(initialState);
export const MapUpdaterContext: Context<any> = createContext((state: MapStateProps, key: string, value: any) => {});

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
    (map_state: MapStateProps, key: string, value: any) => {
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
    (map_state: MapStateProps, updates: { [key: string]: string | number | boolean | string[] }) => {
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

  const initializeFilters = () => {
    if (search.get('baths')) {
      let value = Number(search.get('baths'));
      if (!isNaN(value)) init.baths = value;
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
  };

  initializeFilters();
  const [state, setState] = useState<MapStateProps>(init);
  const debounced = useDebounce(state.query, 400);

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
    if (state.query && state.place && state.place.place_id && !state.is_loading) {
      setState({
        ...state,
        is_loading: true,
      });
    }
  }, [state.place, state.is_loading]);

  useEffect(() => {
    if (state.query) {
      router.push(`/map?${state.query}`);
    }
  }, [state.query]);

  return (
    <MapStateContext.Provider value={state}>
      <MapUpdaterContext.Provider value={setState}>{props.children}</MapUpdaterContext.Provider>
    </MapStateContext.Provider>
  );
};

export default MapProvider;
