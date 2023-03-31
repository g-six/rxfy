'use client';
import React, { useEffect } from 'react';
import { useMapState } from '@/app/AppContext.module';

export function RxLiveNumber({ className, filter }: { className: string; filter: string }) {
  const state = useMapState();
  return <span className={`${className} rexified`}>{(state[filter] as number) || 0}</span>;
}

export default RxLiveNumber;
