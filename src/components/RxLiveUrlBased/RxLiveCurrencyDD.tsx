'use client';
import React, { MouseEvent, ReactElement, useEffect, useState } from 'react';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import { MapStateProps, useMapState, useMapUpdater } from '@/app/AppContext.module';

export function RxLiveCurrencyDD({
  className,
  toggleClassName,
  child,
  filter,
}: {
  toggleClassName?: string;
  className?: string;
  child: React.ReactElement;
  filter: string;
}) {
  const search: ReadonlyURLSearchParams = useSearchParams();
  const state: MapStateProps = useMapState();
  const updater = useMapUpdater();
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

  useEffect(() => {
    if (!is_open) {
      document.querySelectorAll('.w-dropdown-toggle').forEach(e => {
        // e.dispatchEvent(new Event('click'));
      });
    }
  }, [is_open]);

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

            updater(state, filter, amount);
            // updater(state, 'minprice', amount)
            // Object.keys(params).forEach(key => {
            //   if (key === filter) {
            //     search = `${search}&${key}=${counter}`;
            //   } else {
            //     search = `${search}&${key}=${params[key]}`;
            //   }
            // });

            // search = search.substring(1);

            // updater(state)
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
    onClick: () => {
      // toggleDropdown(false);
      // console.log({ filter });
      //   let search = '';
      //   if (child.props.className.split(' ').includes(`${filter}-less`)) {
      //     counter = counter - 1;
      //   } else {
      //     counter = counter + 1;
      //   }
      //   if (counter < 1) counter = 1;
      //   Object.keys(params).forEach(key => {
      //     if (key === filter) {
      //       search = `${search}&${key}=${counter}`;
      //     } else {
      //       search = `${search}&${key}=${params[key]}`;
      //     }
      //   });
      //   search = search.substring(1);
      //   updater(state, 'query', search);
    },
  });
}

export default RxLiveCurrencyDD;
