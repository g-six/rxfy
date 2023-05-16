'use client';
import React from 'react';
import { useMapMultiUpdater, useMapState, useMapUpdater } from '@/app/AppContext.module';
import { MapStatePropsWithFilters } from '@/_typings/property';
import useDebounce from '@/hooks/useDebounce';

export function RxLiveInput({ className, filter, inputType }: { className: string; filter: string; inputType?: string }) {
  const state: MapStatePropsWithFilters = useMapState();
  const updater = useMapMultiUpdater();
  const [value, setValue] = React.useState(state[filter] || '');
  const debounced = useDebounce(`${value || ''}`, 400);

  React.useEffect(() => {
    const num = Number(debounced);
    if (!isNaN(num)) {
      updater(state, {
        [filter]: num,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <input
      type={inputType || 'text'}
      className={`${className} rexified`}
      defaultValue={state[filter] as string | number}
      onChange={e => {
        setValue(e.currentTarget.value);
      }}
    />
  );
}

export default RxLiveInput;
