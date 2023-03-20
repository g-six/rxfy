'use client';
import { ChangeEvent, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { CheckIcon, MapPinIcon } from '@heroicons/react/20/solid';
import { Combobox } from '@headlessui/react';

import styles from './RxSearchInput.module.scss';
import { classNames } from '@/_utilities/html-helper';
import {
  useMapState,
  useMapUpdater,
} from '@/app/AppContext.module';

export type SearchInputProps = {
  name: string;
  id: string;
  placeholder?: string;
  className?: string;
  onPlaceSelected(
    place: google.maps.places.AutocompletePrediction
  ): void;
};

export default function SearchInput(p: SearchInputProps) {
  const updateMapState = useMapUpdater();
  const map_state = useMapState();
  const classnames = [styles['txt-search-input']];
  const [query, setQuery] = useState('');

  function setValue(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.currentTarget.value);
  }

  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GGL_KEY as string,
    version: 'weekly',
    libraries: ['places'],
  });

  useEffect(() => {
    if (map_state.place) {
      p.onPlaceSelected(map_state.place);
    }
  }, [map_state, p]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loader.load().then((google) => {
        window.google = google;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (p.className) classnames.push(p.className);

  return (
    <Combobox
      as='div'
      defaultValue={map_state.details?.name || map_state.place}
      onChange={(value) => {
        updateMapState(map_state, 'place', value);
      }}
      className='flex-1 w-full'
    >
      <div className='relative w-full'>
        <Combobox.Input
          className='w-full rounded-md border-0 bg-white p-0 text-gray-900 focus:ring-0 focus:outline-0 sm:text-sm sm:leading-6'
          onChange={(e) => {
            setValue(e);
            updateMapState(
              map_state,
              'query',
              e.currentTarget.value
            );
            // setSelectedLocation({
            //   ...selectedLocation,
            //   query: e.currentTarget.value,
            // });
          }}
          displayValue={(p?: { description: string }) =>
            p?.description || query
          }
        />

        {map_state.suggestions &&
          map_state.suggestions.length > 0 && (
            <Combobox.Options className='absolute px-0 z-[999] -left-2 mt-2 max-h-56 overflow-y-auto w-96 rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'>
              {map_state.suggestions.map(
                (
                  suggestion: google.maps.places.AutocompletePrediction
                ) => (
                  <Combobox.Option
                    key={suggestion.place_id}
                    value={suggestion}
                    className={({ active }) =>
                      classNames(
                        'relative cursor-default select-none py-2 pl-3 pr-2 flex items-center',
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-900'
                      )
                    }
                  >
                    {({ active, selected }) => (
                      <>
                        <MapPinIcon
                          className={classNames(
                            'h-4 w-4 flex-shrink-0 rounded-full',
                            selected
                              ? 'fill-indigo-600'
                              : active
                              ? 'fill-slate-100'
                              : 'fill-slate-400'
                          )}
                        />
                        <span
                          className={classNames(
                            'ml-3 truncate',
                            selected && 'font-semibold'
                          )}
                        >
                          {suggestion?.description || query}
                        </span>

                        {selected && (
                          <span
                            className={classNames(
                              'absolute inset-y-0 right-0 flex items-center pr-4',
                              active
                                ? 'text-white'
                                : 'text-indigo-600'
                            )}
                          >
                            <CheckIcon
                              className='h-5 w-5'
                              aria-hidden='true'
                            />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                )
              )}
            </Combobox.Options>
          )}
      </div>
    </Combobox>
  );
}
