'use client';
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useMapMultiUpdater, useMapState, useMapUpdater } from '@/app/AppContext.module';
import { objectToQueryString, queryStringToObject } from '@/_utilities/url-helper';

export function RxLiveNumericStep({ child, filter }: { child: React.ReactElement; filter: string }) {
  const state = useMapState();
  const updater = useMapMultiUpdater();
  const search = useSearchParams();
  const filters = queryStringToObject(search.toString());
  let counter = Number(state[filter] || '0');

  return React.cloneElement(child, {
    className: `${child.props.className} rexified`,
    onClick: () => {
      if (child.props.className.split(' ').includes(`${filter}-less`)) {
        counter = counter - 1;
      } else {
        counter = counter + 1;
      }
      if (counter < 1) counter = 1;
      filters[filter] = counter;
      updater(state, {
        [filter]: counter,
        query: objectToQueryString(filters),
        reload: true,
      });
    },
  });
}

export default RxLiveNumericStep;
