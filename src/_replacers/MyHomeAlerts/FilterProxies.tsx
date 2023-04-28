import { ReactElement, useEffect, useState } from 'react';

import SearchInput from '@/components/RxSearchInput';
import { PlaceDetails } from '@/_typings/maps';
import { getPlaceDetails } from '@/_utilities/geocoding-helper';
import { searchInput } from '@/_typings/my-home-alerts';

interface SearchInputProxyProps {
  child: ReactElement;
  initialState: searchInput;
  handleChange: (val: any) => void;
}

export const SearchInputProxy = ({ child, initialState, handleChange }: SearchInputProxyProps) => {
  const [responseData, setResponseData] = useState<searchInput>(initialState ?? {});
  const [pickedPlace, setPickedPlace] = useState<any>({});

  useEffect(() => {
    if (pickedPlace?.description) {
      getPlaceDetails(pickedPlace).then((details: PlaceDetails) => {
        const { name, lat, lng, ne_lat, ne_lng, sw_lat, sw_lng } = details;
        setResponseData({ city: name, lat, lng, nelat: ne_lat, nelng: ne_lng, swlat: sw_lat, swlng: sw_lng } as searchInput);
        handleChange({ city: name, lat, lng, nelat: ne_lat, nelng: ne_lng, swlat: sw_lat, swlng: sw_lng } as searchInput);
      });
    }
  }, [pickedPlace]);
  return (
    <SearchInput
      id='search-input'
      name='search-input'
      className={`${child.props.className} w-full`}
      onPlaceSelected={(selected_place: google.maps.places.AutocompletePrediction) => {
        if (selected_place) {
          setPickedPlace(selected_place);
        }
      }}
    />
  );
};
