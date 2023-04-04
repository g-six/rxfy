'use client';
import React, { MouseEvent, useState } from 'react';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import { useMapState, useMapMultiUpdater } from '@/app/AppContext.module';
import { MapStatePropsWithFilters } from '@/_typings/property';

const SEPARATOR = '%2F';
export function RxLiveCheckbox({ child, filter, value }: { child: React.ReactElement; filter: string; value: string }) {
  const search: ReadonlyURLSearchParams = useSearchParams();
  const state: MapStatePropsWithFilters = useMapState();
  const updater = useMapMultiUpdater();
  const [is_selected, toggleSelected] = useState<boolean>((state.types && state.types.includes(value)) as boolean);
  let params: {
    [key: string]: string[] | string;
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
        [k]: k === filter ? v.split(SEPARATOR) : v,
      };
    }
  });

  if (child.type === 'label' && child.props.className.split(' ').includes('w-checkbox')) {
    return React.cloneElement(child, {
      children: child.props.children.map((c: any) => {
        if (c.type === 'div') {
          return React.cloneElement(c, {
            className: `${c.props.className} ${is_selected ? 'w--redirected-checked ' : ''}rexified RxLiveCheckbox`,
            onClick: (e: MouseEvent) => {
              let query = '';
              params[filter] = toggleValueState((state[filter] as string[]) || [], value, !is_selected);
              Object.keys(params).forEach(key => {
                if (key === filter) {
                  if (params[filter]) {
                    query = `${query}&${key}=${(params[filter] as string[]).join(SEPARATOR)}`;
                  }
                } else {
                  query = `${query}&${key}=${params[key]}`;
                }
              });
              query = query.substring(1);
              updater(state, {
                query,
                [filter]: params[filter] as string[],
                reload: true,
              });
              toggleSelected(!is_selected);
            },
          });
        }
        return c;
      }),
    });
  }
  return child;
}

function toggleValueState(str: string[], val: string, selected = false) {
  if (selected) {
    if (!str.includes(val)) return str.concat([val]);
  } else {
    return str.filter(v => v !== val);
  }
  return str;
}

export default RxLiveCheckbox;
