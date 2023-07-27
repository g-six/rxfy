'use client';

import SearchAddressCombobox from '@/_replacers/FilterFields/SearchAddressCombobox';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';

export default function MapSearchInput(props: { className: string; placeholder?: string; keyword?: string }) {
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const { keyword } = data as unknown as {
    keyword: string;
  };
  return (
    <SearchAddressCombobox
      className={props.className}
      defaultValue=''
      placeholder={keyword || props.placeholder}
      name='city'
      id='map-city-input'
      onPlaceSelected={(p: {
        address: string;
        area: string;
        city: string;
        country: string;
        neighbourhood?: string;
        lat: number;
        lng: number;
        nelat: number;
        nelng: number;
        swlat: number;
        swlng: number;
      }) => {
        fireEvent({
          ...data,
          ...p,
        } as unknown as EventsData);
      }}
    />
  );
}
