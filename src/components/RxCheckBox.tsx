'use client';

import { Events } from '@/_typings/events';
import useEvent from '@/hooks/useEvent';
import React from 'react';

type RxProps = {
  name: string;
  className?: string;
  defaultChecked?: boolean;
  children: React.ReactElement;
  data?: Record<string, string>;
  ['rx-event']: Events;
};
export function RxCheckBox(p: RxProps) {
  const evt = useEvent(p['rx-event']);
  return (
    <input
      {...p}
      type='checkbox'
      className={[p.className || '', 'rexified'].join(' ')}
      name={p.name}
      defaultChecked={p.defaultChecked || false}
      onChange={e => {
        evt.fireEvent({
          ...evt.data,
          [p.name]: e.currentTarget.checked,
        });
      }}
    />
  );
}
