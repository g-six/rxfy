'use client';
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useMapState } from '@/app/AppContext.module';

export function RxLiveBedrooms({ className }: { className: string }) {
  const state = useMapState();
  const search = useSearchParams();

  let query = state.query;
  if (!query) {
    query = search.toString();
  }
  let params: {
    [key: string]: string | number;
  } = {};
  query.split('&').map(kv => {
    if (kv) {
      const [k, v] = kv.split('=');
      params = {
        ...params,
        [k]: isNaN(Number(v)) ? v : Number(v),
      };
    }
  });

  return <span className={`${className} rexified`}>{params.beds || 0}</span>;
}

export default RxLiveBedrooms;
