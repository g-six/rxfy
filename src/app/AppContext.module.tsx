'use client';
/* eslint-disable react-hooks/exhaustive-deps */
import useDebounce from '@/hooks/useDebounce';
import { PlaceDetails } from '@/_typings/maps';
import { getPlaceDetails } from '@/_utilities/geocoding-helper';
import React, { Context, createContext, useEffect, useState } from 'react';

// Initial value of context state
export interface MapStateProps {
  is_loading?: boolean;
  query: string;
  place?: google.maps.places.AutocompletePrediction;
  suggestions: google.maps.places.AutocompletePrediction[];
  details?: PlaceDetails;
}
interface MapStateUpdaterProps {
  setSelectedLocation(selectedLocation: {
    query: string;
    place?: google.maps.places.AutocompletePrediction;
    suggestions: google.maps.places.AutocompletePrediction[];
  }): void;
}
const initialState: MapStateProps = {
  query: '',
  suggestions: [],
};
function updateAddressURL(address: PlaceDetails) {
  if (typeof window !== 'undefined') {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('lat', `${address.lat}`);
    currentUrl.searchParams.set('lng', `${address.lng}`);
    currentUrl.searchParams.set('nelat', `${address.ne_lat}`);
    currentUrl.searchParams.set('nelng', `${address.ne_lng}`);
    currentUrl.searchParams.set('swlat', `${address.sw_lat}`);
    currentUrl.searchParams.set('swlng', `${address.sw_lng}`);
    currentUrl.searchParams.set('city', address.vicinity);
    window.history.pushState({}, address.name, currentUrl.href);
  }
}
// Create the Map context
// export const MapContext = createContext(initialState);
export const MapStateContext = createContext(initialState);
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

// Create the provider which holds the state
export const MapProvider = (props: any) => {
  const [state, setState] = useState<MapStateProps>(initialState);
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

  return (
    <MapStateContext.Provider value={state}>
      <MapUpdaterContext.Provider value={setState}>{props.children}</MapUpdaterContext.Provider>
    </MapStateContext.Provider>
  );
};

export default MapProvider;
