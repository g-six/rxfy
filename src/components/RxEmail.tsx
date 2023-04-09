'use client';

import { Events } from '@/_typings/events';
import useEvent from '@/hooks/useEvent';
import React from 'react';

type RxProps = {
  name: string;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
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
      placeholder={p.placeholder || ''}
      defaultValue={p.defaultValue || ''}
      onKeyDown={e => {
        if (e.code && e.code.toLowerCase() === 'enter') {
          evt.fireEvent({
            ...evt.data,
            clicked: `${p['rx-event']}-trigger`,
            [p.name]: e.currentTarget.value,
          });
        }
      }}
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
