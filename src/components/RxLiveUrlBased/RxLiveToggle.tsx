'use client';
import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@headlessui/react';
import { useMapUpdater, useMapMultiUpdater, useMapState } from '@/app/AppContext.module';
import { queryStringToObject } from '@/_utilities/url-helper';
import { classNames } from '@/_utilities/html-helper';
import { objectToQueryString } from '@/_utilities/url-helper';

export function RxLiveToggle({ filter, value }: { filter: string; value: string }) {
  const state = useMapState();
  const updater = useMapMultiUpdater();
  const clear = useMapUpdater();
  const search = useSearchParams();
  const filters = queryStringToObject(search.toString());
  const [active, toggleActive] = React.useState<string | undefined>();

  React.useEffect(() => {
    const updated_state = {
      ...state,
      reload: true,
    } as unknown as { [key: string]: unknown };
    if (active) {
      filters[filter] = active;
      updated_state[filter] = active;
    } else {
      clear(state, 'agent', undefined);
      updated_state[filter] = undefined;
      delete filters[filter];
    }
    updated_state.query = objectToQueryString(filters);
    updater(
      state,
      updated_state as unknown as {
        [key: string]: string | number | boolean;
      },
    );
  }, [active]);

  return (
    <Switch
      onChange={toggle => {
        if (toggle) {
          toggleActive(value);
        } else {
          toggleActive(undefined);
        }
      }}
      className={classNames(
        active ? 'bg-indigo-600' : 'bg-gray-200',
        'ml-1 relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
      )}
    >
      <span className='sr-only'>{active ? 'Other properties hidden' : 'Showing all properties'}</span>
      <span
        aria-hidden='true'
        className={classNames(
          active ? 'translate-x-4' : '-translate-x-1',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        )}
      />
    </Switch>
  );
}

export default RxLiveToggle;
