'use client';
import React, { MouseEvent, ReactElement, useEffect, useState } from 'react';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import { useMapState, useMapMultiUpdater } from '@/app/AppContext.module';
import { MapStatePropsWithFilters } from '@/_typings/property';

export function RxLiveCurrencyDD({ child, filter }: { child: React.ReactElement; filter: string }) {
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

  let options: ReactElement[] = [];
  if (child.props.children && Array.isArray(child.props.children)) {
    options = child.props.children.map((option: ReactElement) => {
      if (option.type && option.type === 'a') {
        return React.cloneElement(option, {
          className: `${option.props.className} rexified`,
          onClick: (e: MouseEvent) => {
            const stripped_dollar = e.currentTarget.textContent?.substring(1);
            const zeroes: 'k' | 'M' = (stripped_dollar?.substring(stripped_dollar.length - 1) || 'k') as 'k' | 'M';
            const numbers = stripped_dollar?.substring(0, stripped_dollar.length - 1);
            const amount = Number(numbers) ? Number(numbers) * 1000 * (zeroes === 'M' ? 1000 : 1) : 0;
            let query = '';
            params[filter] = amount;
            Object.keys(params).forEach(key => {
              if (key === filter) {
                console.log(`${query}&${key}=${amount}`);
                query = `${query}&${key}=${amount}`;
              } else {
                query = `${query}&${key}=${params[key]}`;
              }
            });

            query = query.substring(1);
            updater(state, {
              query,
              [filter]: amount,
            });

            toggleDropdown(false);
          },
        });
      }
      return option;
    });
  }
  const classNames = child.props.className.split(' ').filter((str: string) => str !== 'is-shown');
  child;
  return React.cloneElement(child, {
    className: `${classNames.join(' ')} rexified transition-all${is_open ? '' : ''}`,
    children: options,
    onClick: () => {},
  });
}

export default RxLiveCurrencyDD;
