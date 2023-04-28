'use client';
import React from 'react';
import styles from './RxCombobox.module.scss';
import RxLiveCurrencyDD from './RxLiveUrlBased/RxLiveCurrencyDD';
import { useMapMultiUpdater, useMapState } from '@/app/AppContext.module';
import { MapStatePropsWithFilters } from '@/_typings/property';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import { objectToQueryString, queryStringToObject } from '@/_utilities/url-helper';

interface RxComboboxProps {
  className?: string;
  children: React.ReactElement[];
  ['data-value-for']: string;
}

export default function RxCombobox(p: RxComboboxProps) {
  const search: ReadonlyURLSearchParams = useSearchParams();
  const state: MapStatePropsWithFilters = useMapState();
  const updater = useMapMultiUpdater();

  // Get current
  let params = queryStringToObject(search.toString());

  const [opened, toggleOpen] = React.useState(false);

  return (
    <div
      className={`${p['data-value-for']} rexified ${p.className?.split('w-dropdown').join('')} ${styles.RxCombobox}`}
      onClick={e => {
        toggleOpen(true);
      }}
    >
      {p.children?.map((c: React.ReactElement) => {
        console.log(c.props);
        const opts: {
          ['aria-expanded']?: 'true' | 'false';
          children?: React.ReactElement;
        } = c.type === 'nav' ? {} : { ['aria-expanded']: opened ? 'true' : 'false' };
        if (c.type === 'div') {
          if (typeof c.props.children === 'object') {
            opts.children = <RxLiveCurrencyDD child={c.props.children} filter={p['data-value-for']} />;
          }
        }
        return React.cloneElement(c, {
          className: `${c.props.className} rexified-${c.type}`,
          ...opts,
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            const stripped_dollar = e.currentTarget.textContent?.substring(1);
            const zeroes: 'k' | 'M' = (stripped_dollar?.substring(stripped_dollar.length - 1) || 'k') as 'k' | 'M';
            const numbers = stripped_dollar?.substring(0, stripped_dollar.length - 1);
            const amount = Number(numbers) ? Number(numbers) * 1000 * (zeroes === 'M' ? 1000 : 1) : 0;
            params[p['data-value-for']] = amount;

            updater(state, {
              [p['data-value-for']]: amount,
              query: objectToQueryString(params),
              reload: true,
            });

            toggleOpen(false);
          },
        });
      })}
    </div>
  );
}
