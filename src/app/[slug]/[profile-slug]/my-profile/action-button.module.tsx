'use client';
import React from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';

export default function ActionButton({ children, ...props }: { children: React.ReactElement; className: string }) {
  const { fireEvent } = useEvent(Events.SaveAccountChanges);

  return (
    <button
      {...props}
      onClick={(evt: React.SyntheticEvent<HTMLButtonElement>) => {
        fireEvent({ action: evt.currentTarget.className.includes('save') ? 'save' : 'reset' } as unknown as EventsData);
      }}
    >
      {children}
    </button>
  );
}
