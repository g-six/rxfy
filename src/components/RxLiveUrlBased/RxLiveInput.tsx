'use client';
import React from 'react';
import { useMapState, useMapUpdater } from '@/app/AppContext.module';
import { MapStatePropsWithFilters } from '@/_typings/property';

export function RxLiveInput({ className, filter, inputType }: { className: string; filter: string; inputType?: string }) {
  const state: MapStatePropsWithFilters = useMapState();
  const update = useMapUpdater();
  return (
    <input
      type={inputType || 'text'}
      className={`${className} rexified`}
      defaultValue={state[filter] as string | number}
      onChange={e => {
        const num = Number(e.currentTarget.value);
        update(state, filter, isNaN(num) ? e.currentTarget.value : num);
      }}
    />
  );
}

export default RxLiveInput;
