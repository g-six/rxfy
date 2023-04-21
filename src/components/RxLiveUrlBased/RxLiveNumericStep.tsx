'use client';
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useMapMultiUpdater, useMapState, useMapUpdater } from '@/app/AppContext.module';

export function RxLiveNumericStep({ child, filter }: { child: React.ReactElement; filter: string }) {
  const state = useMapState();
  const updater = useMapMultiUpdater();
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

      updater(state, {
        [filter]: counter,
        reload: true,
      });
    },
  });
}

export default RxLiveNumericStep;
