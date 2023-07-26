'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { DEF_LEGACY_PAYLOAD } from '@/_utilities/api-calls/call-legacy-search';
import { objectToQueryString, queryStringToObject } from '@/_utilities/url-helper';
import React from 'react';
import { Events, EventsData } from '@/hooks/useFormEvent';
import { FilterUpdateButton } from '../RxCards/RxPropertyCardList';
import useEvent from '@/hooks/useEvent';

function Iterator({
  children,
  ...props
}: {
  children: React.ReactElement;
  'agent-id'?: string;
  'agent-record-id'?: number;
  'profile-slug'?: string;
  'agent-metatag-id'?: number;
  'is-searching'?: boolean;
  filters: MapFilters;
  onChange: (className: string) => void;
}) {
  const Wrapped = React.Children.map(children, c => {
    if (['div', 'nav'].includes(`${c.type}`)) {
      const { children: subchildren, className, ...subprops } = c.props;

      //<-- Buttons -->
      if (className?.includes('-less')) {
        return (
          <button type='button' className={className + ' rexified bg-transparent'} onClick={() => props.onChange(className, -1)}>
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

      //<-- Labels -->
      if (className?.includes('beds-min')) {
        return React.cloneElement(c, c.props, [props.filters.beds]);
      }
      if (className?.includes('baths-min')) {
        return React.cloneElement(c, c.props, [props.filters.baths]);
      }
      if (className?.includes('w-dropdown-list') && props['is-searching']) {
        return React.cloneElement(c, {
          className: className.split(' w--open').join(''),
        });
      }

      return (
        <div {...subprops} className={className || '' + ' rexified RxMapFilters iterator'}>
          <Iterator {...props}>{subchildren}</Iterator>
        </div>
      );
    }
    if (c.type === 'a') {
      if (c.props?.className?.includes('do-search')) {
        return <FilterUpdateButton className={c.props.className + ' rexified bg-transparent'}>{convertDivsToSpans(c.props.children)}</FilterUpdateButton>;
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
  const [filters, setFilters] = React.useState<MapFilters>(DEFAULT_MAP_FILTERS);
  const [is_searching, toggleSearching] = React.useState<boolean>(false);
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
      } as unknown as EventsData);
    }
  };

  React.useEffect(() => {
    updateLegacyFilters(filters);
  }, [filters]);

  React.useEffect(() => {
    if (q.toString()) {
      const init = queryStringToObject(q.toString()) as unknown as MapFilters;
      setFilters(init);
      updateLegacyFilters(init);
    } else {
      const qs = objectToQueryString(filters);
      router.push(location.pathname + '?' + qs);
    }
  }, []);

  return (
    <Iterator
      {...values}
      filters={filters}
      is-searching={is_searching}
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
        updateLegacyFilters(updated_filters);
      }}
    >
      {children}
    </Iterator>
  );
}
