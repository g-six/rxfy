'use client';
import React from 'react';
import { MapStateProps, useMapState } from '@/app/AppContext.module';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';

export function RxLiveStringValue({ className, filter }: { className: string; filter: string }) {
  const search: ReadonlyURLSearchParams = useSearchParams();
  const state: MapStateProps = useMapState();

  let value = `${search.get(filter) || state[filter]}`;
  if (['minprice', 'maxprice'].includes(filter)) {
    value = isNaN(Number(value)) ? '0' : getShortPrice(state[filter] as number, '');
  }
  return <span className={`${className} rexified RxLiveStringValue`}>{value}</span>;
}

export default RxLiveStringValue;
