'use client';
import React from 'react';
import useEvent, { Events } from '@/hooks/useEvent';

export default function HomeAlertCloseButton({ children, className }: { children: React.ReactElement; className: string }) {
  const trigger = useEvent(Events.MyHomeAlertsForm);

  return (
    <button
      type='button'
      className={className}
      onClick={() => {
        trigger.fireEvent({
          show: false,
        });
      }}
    >
      {children}
    </button>
  );
}
