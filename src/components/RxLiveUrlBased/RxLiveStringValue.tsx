'use client';
import React from 'react';
import { MapStateProps, useMapState } from '@/app/AppContext.module';
import { getShortPrice } from '@/_utilities/map-helper';

function getValueFormattedForComponent(key: string, value: string | number) {
  switch (key) {
    case 'minprice':
    case 'maxprice':
      return getShortPrice(Number(value));
    default:
      return value;
  }
}

export function RxLiveStringValue({ className, filter }: { className: string; filter: string }) {
  const state: MapStateProps = useMapState();

  let value = `${state[filter]}`;
  if (['minprice', 'maxprice'].includes(filter)) {
    value = isNaN(Number(value)) ? '0' : getShortPrice(state[filter] as number, '');
  }
  return <span className={`${className} rexified`}>{value}</span>;
}

export default RxLiveStringValue;
