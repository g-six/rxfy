'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { DEF_LEGACY_PAYLOAD } from '@/_utilities/api-calls/call-legacy-search';
import { objectToQueryString, queryStringToObject } from '@/_utilities/url-helper';
import React from 'react';
import { Events, EventsData } from '@/hooks/useFormEvent';
import useEvent from '@/hooks/useEvent';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import { classNames } from '@/_utilities/html-helper';

import styles from './RxMapFilters.module.scss';
import OtherMapFilters from '@/app/map/other-filters.module';

function ButtonIterator(props: { children: React.ReactElement; filters: MapFilters; onOptionSelect: (evt: React.SyntheticEvent) => void }) {
  const { children, filters, onOptionSelect, ...p } = props;
  const Wrapped = React.Children.map(children, c => {
    const { className } = c.props || {};
    if (c.type === 'div') {
      //<-- Labels -->
      if (className?.includes('beds-min')) {
        return React.cloneElement(<span />, c.props, [filters.beds]);
      }
      if (className?.includes('baths-min')) {
        return React.cloneElement(<span />, c.props, [filters.baths]);
      }
      if (className?.includes('maxprice') && filters.maxprice) {
        return React.cloneElement(<span />, c.props, [getShortPrice(filters.maxprice, '')]);
      }
      if (className?.includes('minprice') && filters.minprice) {
        return React.cloneElement(<span />, c.props, [getShortPrice(filters.minprice, '')]);
      }
      return (
        <span {...p}>
          <ButtonIterator {...p} onOptionSelect={onOptionSelect} filters={filters}>
            {c.props.children}
          </ButtonIterator>
        </span>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

function Iterator({
  children,
  ...props
}: {
  children: React.ReactElement;
  'agent-id'?: string;
  'agent-record-id'?: number;
  'profile-slug'?: string;
  'agent-metatag-id'?: number;
  filters: MapFilters;
  onChange: (className: string) => void;
  onReset(): void;
  onSubmit(): void;
  onOptionSelect: (evt: React.SyntheticEvent) => void;
  'data-value'?: string;
}) {
  const Wrapped = React.Children.map(children, c => {
    if (['div', 'nav'].includes(`${c.type}`)) {
      const { children: subchildren, className, ...subprops } = c.props;

      //<-- Property type filter modal trigger -->
      if (className?.includes('w-dropdown-toggle')) {
        let modal = '';
        if (className?.includes('proptypefilters-toggle')) modal = '.filters-dropdown-modal';
        else if (className?.includes('priceminmax-toggle')) modal = '.price-dropdown-modal';
        else if (className?.includes('bedbathandbeyond-toggle')) modal = '.bedroom-dropdown-modal';
        else if (className?.includes('map-sort-modal-button')) modal = '.dropdown-wrap-3';
        else return c;
        return (
          <button
            type='button'
            className={className + ' rexified bg-transparent'}
            onClick={(evt: React.SyntheticEvent) => {
              evt.preventDefault();
              evt.stopPropagation();
              document.querySelectorAll('.w--open').forEach(el => el.classList.remove('w--open'));
              if (evt.currentTarget.classList.contains('w--open')) {
                evt.currentTarget.classList.remove('w--open');
                evt.currentTarget.setAttribute('aria-expanded', 'true');
              } else if (modal) {
                document.querySelector(modal)?.classList.add('w--open');
                evt.currentTarget.classList.add('w--open');
                evt.currentTarget.setAttribute('aria-expanded', 'false');
              }
            }}
          >
            <ButtonIterator {...props}>{subchildren}</ButtonIterator>
          </button>
        );
      }
      //<-- Buttons -->
      if (className?.includes('-less')) {
        return (
          <button type='button' className={className + ' rexified bg-transparent'} onClick={() => props.onChange(className)}>
            {convertDivsToSpans(subchildren)}
          </button>
        );
      }
      if (className?.includes('-more')) {
        return (
          <button type='button' className={className + ' rexified bg-transparent'} onClick={() => props.onChange(className)}>
            {convertDivsToSpans(subchildren)}
          </button>
        );
      }

      if (className?.includes('min-price-dropdown')) {
        return (
          <div {...c.props} className={className + ' rexified'}>
            <Iterator {...c.props} onOptionSelect={props.onOptionSelect} data-value='minprice'>
              {c.props.children}
            </Iterator>
          </div>
        );
      }
      if (className?.includes('filters-dropdown-modal')) {
        return <OtherMapFilters className={className.split('w-dropdown-list').join('hidden absolute')}>{subchildren}</OtherMapFilters>;
      }
      if (className?.includes('max-price-dropdown')) {
        return (
          <div {...c.props} className={className + ' rexified'}>
            <Iterator {...c.props} onOptionSelect={props.onOptionSelect} data-value='maxprice'>
              {c.props.children}
            </Iterator>
          </div>
        );
      }
      if (className?.includes('dropdown-wrap')) {
        return (
          <div {...c.props} className={className + ' rexified'}>
            <Iterator {...c.props} onOptionSelect={props.onOptionSelect} data-value={props['data-value']}>
              {c.props.children}
            </Iterator>
          </div>
        );
      }
      if (className?.includes('w-dropdown-list')) {
        return React.cloneElement(
          c,
          {
            className: className.split(' w--open').join('') + ' rexified',
          },
          <Iterator {...props}>{c.props.children}</Iterator>,
        );
      }
      if (className?.includes('beds-min')) {
        return React.cloneElement(<span />, c.props, [props.filters.beds]);
      }
      if (className?.includes('baths-min')) {
        return React.cloneElement(<span />, c.props, [props.filters.baths]);
      }

      return (
        <div {...subprops} className={className || '' + ' rexified RxMapFilters iterator'}>
          <Iterator {...props} onOptionSelect={props.onOptionSelect}>
            {subchildren}
          </Iterator>
        </div>
      );
    }
    if (c.type === 'a') {
      if (c.props?.className?.includes('do-search')) {
        return (
          <button type='button' className={c.props.className + ' rexified bg-transparent'} onClick={props.onSubmit}>
            {convertDivsToSpans(c.props.children)}
          </button>
        );
      }
      if (c.props?.className?.includes('do-reset')) {
        return (
          <button type='reset' className={c.props.className + ' rexified bg-transparent'} onClick={props.onReset}>
            {convertDivsToSpans(c.props.children)}
          </button>
        );
      }
      if (c.props?.className?.includes('dropdown-link')) {
        return (
          <button
            type='button'
            className={classNames(c.props.className, 'rexified', styles.option)}
            onClick={props.onOptionSelect}
            data-value={props['data-value']}
          >
            {c.props.children}
          </button>
        );
      }
    }
    return c;
  });
  return <>{Wrapped}</>;
}

type MapFilters = {
  city: string;
  beds: number;
  baths: number;
  minprice: number;
  maxprice: number;
  lat: number;
  lng: number;
  nelat: number;
  nelng: number;
  swlat: number;
  swlng: number;
  zoom: number;
  type: string;
};

export const DEFAULT_MAP_FILTERS: MapFilters = {
  beds: 1,
  baths: 1,
  minprice: 750000,
  maxprice: 20000000,
  city: 'Vancouver',
  lat: 49.274527699999794,
  lng: -123.11389869999971,
  nelat: 49.83577091979831,
  nelng: -121.98889440846511,
  swlat: 48.706825137481275,
  swlng: -124.23890299153396,
  zoom: 9,
  type: 'R',
};
export default function RxMapFilters({ children, ...values }: { [key: string]: string } & { children: React.ReactElement }) {
  const router = useRouter();
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const { loading } = data as unknown as {
    loading: boolean;
  };
  const q = useSearchParams();
  let init = DEFAULT_MAP_FILTERS;
  if (q.toString()) {
    init = queryStringToObject(q.toString()) as unknown as MapFilters;
  }

  const [filters, setFilters] = React.useState<MapFilters>(init);
  const [legacy_filters, setLegacyFilters] = React.useState<LegacySearchPayload>({
    ...DEF_LEGACY_PAYLOAD,
  });

  const updateLegacyFilters = (f: MapFilters) => {
    if (f) {
      const filter = [
        {
          match: { 'data.Status': 'Active' },
        },
        {
          range: {
            'data.L_TotalBaths': {
              lte: f.baths,
            },
          },
        },
        {
          range: {
            'data.L_BedroomTotal': {
              lte: f.beds,
            },
          },
        },
      ];
      const updated_filters = {
        ...legacy_filters,
        query: {
          ...legacy_filters.query,
          bool: {
            ...legacy_filters.query.bool,
            filter,
          },
        },
        size: 1000,
      };

      fireEvent({
        ...data,
        filters: updated_filters,
        reload: true,
      } as unknown as EventsData);
    }
  };

  React.useEffect(() => {
    document.querySelectorAll('.combobox-list').forEach(el => el.classList.remove('w--open'));
  }, [filters]);

  // React.useEffect(() => {
  //   if (q.toString()) {
  //     const init = queryStringToObject(q.toString()) as unknown as MapFilters;
  //     setFilters(init);
  //   } else {
  //     const qs = objectToQueryString(filters);
  //     router.push(location.pathname + '?' + qs);
  //   }
  // }, []);

  return (
    <Iterator
      {...values}
      filters={filters}
      onReset={() => {
        const { minprice, maxprice } = DEFAULT_MAP_FILTERS;
        const updated_filters = {
          ...filters,
          minprice,
          maxprice,
        };
        setFilters(updated_filters);
        const qs = objectToQueryString(updated_filters as unknown as { [k: string]: string });
        router.push('map?' + qs);
        document.querySelectorAll('.w--open').forEach(el => el.classList.remove('w--open'));
        document.querySelectorAll('[aria-expanded]').forEach(el => el.setAttribute('aria-expanded', 'false'));
        fireEvent({
          ...data,
          reload: true,
        });
      }}
      onSubmit={() => {
        const qs = objectToQueryString(filters as unknown as { [k: string]: string });
        router.push('map?' + qs);
        document.querySelectorAll('.w--open').forEach(el => el.classList.remove('w--open'));
        document.querySelectorAll('[aria-expanded]').forEach(el => el.setAttribute('aria-expanded', 'false'));
        fireEvent({
          ...data,
          reload: true,
        });
      }}
      onChange={(className: string) => {
        let modifier = className?.includes('-less') ? -1 : 1;
        let updated_filters = {
          ...filters,
        };
        if (className?.includes('beds-')) {
          if (filters.beds || modifier > 0) {
            updated_filters = {
              ...updated_filters,
              beds: updated_filters.beds + modifier,
            };
          }
        }

        if (className?.includes('baths-')) {
          if (filters.baths || modifier > 0) {
            updated_filters = {
              ...updated_filters,
              baths: updated_filters.baths + modifier,
            };
          }
        }

        setFilters(updated_filters);
        // updateLegacyFilters(updated_filters);
        // const qs = objectToQueryString(updated_filters as unknown as { [k: string]: string });
        // router.push(location.pathname + '?' + qs);
      }}
      onOptionSelect={(evt: React.SyntheticEvent) => {
        const text = evt.currentTarget.textContent?.toLowerCase() || '';

        if (evt.currentTarget.className.includes('-asc') || evt.currentTarget.className.includes('-desc')) {
          // Sorting options
          let params_with_sort = queryStringToObject(q.toString()) as unknown as { [key: string]: string };
          const [sort] = evt.currentTarget.className.split(' ').filter(cn => cn.includes('-asc') || cn.includes('-desc'));

          if (sort && q.toString()) {
            params_with_sort = {
              ...params_with_sort,
              sort,
            };
            document.querySelectorAll('.w--open').forEach(el => el.classList.remove('w--open'));
            router.push('map?' + objectToQueryString(params_with_sort));
            fireEvent({
              ...data,
              reload: true,
            });
          }
          return;
        }
        const [k] = text.split('$').join('').split('k') || [];
        const [m] = text.split('$').join('').split('m') || [];
        let v = 0;
        if (m && text.includes('m')) {
          const [whole, decimal] = m.split('.').map(Number);
          v = whole * 1000000 + (decimal ? decimal * 100000 : 0);
        } else if (k && text.includes('k')) {
          v = Number(k) * 1000;
        }
        const filter_name = evt.currentTarget.getAttribute('data-value');
        if (filter_name) {
          const f = filters as unknown as {
            [k: string]: any;
          };
          if (f[filter_name] && f[filter_name] === v) return;

          const updated_filters = {
            ...filters,
            [filter_name]: isNaN(Number(v)) ? undefined : v,
          };
          setFilters(updated_filters);
        }
      }}
    >
      {children}
    </Iterator>
  );
}
