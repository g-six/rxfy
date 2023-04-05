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
export function RxTextInput(p: RxProps) {
  const evt = useEvent(p['rx-event']);
  return (
    <input
      type='text'
      className={[p.className || '', 'rexified'].join(' ')}
      name={p.name}
      onChange={e => {
        evt.fireEvent({
          ...evt.data,
          [p.name]: e.currentTarget.value,
        });
      }}
    />
  );
}
