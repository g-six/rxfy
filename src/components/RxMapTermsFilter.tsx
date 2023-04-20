'use client';
import { MapStatePropsWithFilters } from '@/_typings/property';
import { useMapMultiUpdater, useMapState } from '@/app/AppContext.module';
import useDebounce from '@/hooks/useDebounce';
import React from 'react';

type RxMapTermsFilterProps = {
  className: string;
  filter: string;
};

export default function RxMapTermsFilter(p: RxMapTermsFilterProps) {
  const state: MapStatePropsWithFilters = useMapState();
  const updater = useMapMultiUpdater();
  const [terms, filterTerms] = React.useState('');
  const debounced = useDebounce(terms, 600);

  React.useEffect(() => {
    if (debounced.length > 2) {
      updater(state, {
        [p.filter]: [debounced],
        reload: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return (
    <textarea
      className={`rexified ${p.className}`}
      onChange={e => {
        filterTerms(e.currentTarget.value);
      }}
    ></textarea>
  );
}
