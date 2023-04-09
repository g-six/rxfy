'use client';

import { Events } from '@/_typings/events';
import useEvent from '@/hooks/useEvent';
import React from 'react';
import { formatPhone } from '@/_utilities/formatters';

type RxProps = {
  name: string;
  className?: string;
  defaultValue?: string;
  children: React.ReactElement;
  data?: Record<string, string>;
  placeholder?: string;
  ['rx-event']: Events;
};
export function RxPhoneInput(p: RxProps) {
  const evt = useEvent(p['rx-event']);

  return (
    <input
      type='tel'
      className={[p.className || '', 'rexified'].join(' ')}
      name={p.name}
      placeholder={p.placeholder || ''}
      defaultValue={formatPhone(p.defaultValue || '')}
      onBlur={e => {
        e.currentTarget.value = formatPhone(e.currentTarget.value);
      }}
      onKeyDown={e => {
        if (e.code.toLowerCase() === 'enter') {
          e.currentTarget.value = formatPhone(e.currentTarget.value);
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
