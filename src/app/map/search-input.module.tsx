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
        // const payload: LegacySearchPayload = {
        //   from: 0,
        //   size: 500,
        //   query: {
        //     bool: {
        //       filter: [
        //         {
        //           range: {
        //             'data.lat': {
        //               gte: p.swlat,
        //               lte: p.nelat,
        //             },
        //             'data.lng': {
        //               gte: p.swlng,
        //               lte: p.nelng,
        //             },
        //           },
        //         },
        //         {
        //           match: {
        //             'data.Status': 'Active',
        //           },
        //         },
        //       ],
        //       should: [
        //         {
        //           match: {
        //             'data.City': p.city,
        //           },
        //         },
        //       ],
        //       minimum_should_match: 1,
        //     },
        //   },
        // };
        // retrievePublicListingsFromPipeline(payload).then(legacy => {
        //   console.log(legacy);
        //   console.log(p);
        // });
      }}
    />
  );
}
