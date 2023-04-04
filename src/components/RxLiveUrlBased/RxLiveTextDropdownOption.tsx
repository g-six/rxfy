'use client';
import React, { MouseEvent, useState } from 'react';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import { useMapState, useMapMultiUpdater } from '@/app/AppContext.module';
import { MapStatePropsWithFilters } from '@/_typings/property';

export function RxLiveTextDD({ child, filter, value }: { child: React.ReactElement; filter: string; value: string }) {
  const search: ReadonlyURLSearchParams = useSearchParams();
  const state: MapStatePropsWithFilters = useMapState();
  const updater = useMapMultiUpdater();
  const [is_open, toggleDropdown] = useState<boolean>(true);
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

  if (child.type === 'a' && child.props.children && typeof child.props.children === 'string') {
    return React.cloneElement(child, {
      className: `${child.props.className} rexified`,
      onClick: (e: MouseEvent) => {
        let query = '';
        params[filter] = value;
        Object.keys(params).forEach(key => {
          if (key === filter) {
            query = `${query}&${key}=${value}`;
          } else {
            query = `${query}&${key}=${params[key]}`;
          }
        });
        query = query.substring(1);
        updater(state, {
          query,
          [filter]: value,
          reload: true,
        });
        toggleDropdown(false);
      },
    });
  }
  return child;
}

export default RxLiveTextDD;
