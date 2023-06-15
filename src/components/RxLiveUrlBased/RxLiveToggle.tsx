'use client';
import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@headlessui/react';
import { useMapMultiUpdater, useMapState } from '@/app/AppContext.module';
import { queryStringToObject } from '@/_utilities/url-helper';
import { classNames } from '@/_utilities/html-helper';
import { objectToQueryString } from '@/_utilities/url-helper';

export function RxLiveToggle({ filter, value }: { filter: string; value: string }) {
  const state = useMapState();
  const updater = useMapMultiUpdater();
  const search = useSearchParams();
  const filters = queryStringToObject(search.toString());
  return (
    <Switch
      onChange={toggle => {
        if (toggle) {
          filters[filter] = value;
        } else {
          delete filters[filter];
        }
        updater(state, {
          [filter]: filters[filter] || undefined,
          reload: true,
          query: objectToQueryString(filters),
        } as unknown as {
          [key: string]: string | number | boolean;
        });
      }}
      className={classNames(
        filters[filter] ? 'bg-indigo-600' : 'bg-gray-200',
        'ml-1 relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
      )}
    >
      <span className='sr-only'>{filters[filter] ? 'Other properties hidden' : 'Showing all properties'}</span>
      <span
        aria-hidden='true'
        className={classNames(
          filters[filter] ? 'translate-x-4' : '-translate-x-1',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        )}
      />
    </Switch>
  );
}

export default RxLiveToggle;
