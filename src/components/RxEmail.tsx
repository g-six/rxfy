'use client';

import { Events } from '@/_typings/events';
import useEvent from '@/hooks/useEvent';
import React from 'react';

type RxProps = {
  name: string;
  className?: string;
  children: React.ReactElement;
  data?: Record<string, string>;
  ['rx-event']: Events;
};
export function RxEmail(p: RxProps) {
  const evt = useEvent(p['rx-event']);

  return (
    <input
      type='email'
      className={[p.className || '', 'rexified'].join(' ')}
      name={p.name}
      onLoad={e => {
        evt.fireEvent({
          ...evt.data,
          [p.name]: e.currentTarget.value,
        });
      }}
      onChange={e => {
        evt.fireEvent({
          ...evt.data,
          [p.name]: e.currentTarget.value,
        });
      }}
    />
  );
}
