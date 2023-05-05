'use client';

import { Events } from '@/_typings/events';
import useEvent from '@/hooks/useEvent';
import React from 'react';

type RxProps = {
  name: string;
  className?: string;
  defaultValue?: string;
  formatter?: (input: string) => string;
  children?: React.ReactElement;
  data?: Record<string, string>;
  placeholder?: string;
  ['rx-event']: Events;
};
export function RxTextInput(p: RxProps) {
  const evt = useEvent(p['rx-event']);
  return (
    <input
      type='text'
      className={[p.className || '', 'rexified'].join(' ')}
      name={p.name}
      placeholder={p.placeholder || ''}
      defaultValue={p.defaultValue || ''}
      onBlur={e => {
        if (p.formatter) {
          e.currentTarget.value = p.formatter(e.currentTarget.value);
          evt.fireEvent({
            ...evt.data,
            [p.name]: e.currentTarget.value,
          });
        }
      }}
      onKeyDown={e => {
        if (e.code && e.code.toLowerCase() === 'enter') {
          if (p.formatter) {
            e.currentTarget.value = p.formatter(e.currentTarget.value);
          }
          evt.fireEvent({
            ...evt.data,
            clicked: `${p['rx-event']}-trigger`,
            [p.name]: e.currentTarget.value,
          });
        }
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
