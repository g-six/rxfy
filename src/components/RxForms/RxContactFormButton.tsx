'use client';
import React from 'react';
import useEvent from '@/hooks/useEvent';
import { Events } from '@/_typings/events';

export default function RxContactFormButton(p: { className: string; children: React.ReactElement[] }) {
  const { data, fireEvent } = useEvent(Events.ContactFormShow);
  return (
    <button
      className={[p.className, 'rexified'].join(' ').trim()}
      type='button'
      id={`${Events.ContactFormShow}-trigger`}
      onClick={e => {
        fireEvent({
          ...data,
          show: true,
          clicked: e.currentTarget.id,
        });
      }}
    >
      {p.children}
    </button>
  );
}
