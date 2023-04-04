'use client';
import React from 'react';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import { useMapState, useMapUpdater } from '@/app/AppContext.module';
import { MapStatePropsWithFilters } from '@/_typings/property';

export function RxLiveBaseComponent({ child, filter }: { child: React.ReactElement; filter: string }) {
  const search: ReadonlyURLSearchParams = useSearchParams();
  const state: MapStatePropsWithFilters = useMapState();
  let params: {
    [key: string]: string | number;
  } = {};
  let query = state.query;
  if (!query) {
    query = search.toString();
  }
  query.split('&').map(kv => {
    if (kv) {
      const [k, v] = kv.split('=');
      params = {
        ...params,
        [k]: isNaN(Number(v)) ? v : Number(v),
      };
    }
  });

  const updater = useMapUpdater();
  let counter = Number(params[filter] || '0');

  return React.cloneElement(child, {
    className: `${child.props.className} rexified`,
    onClick: () => {
      let search = '';
      if (child.props.className.split(' ').includes(`${filter}-less`)) {
        counter = counter - 1;
      } else {
        counter = counter + 1;
      }
      if (counter < 1) counter = 1;

      Object.keys(params).forEach(key => {
        if (key === filter) {
          search = `${search}&${key}=${counter}`;
        } else {
          search = `${search}&${key}=${params[key]}`;
        }
      });

      search = search.substring(1);
      updater(state, 'query', search);
    },
  });
}

export default RxLiveBaseComponent;
