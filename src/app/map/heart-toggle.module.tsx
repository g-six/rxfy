'use client';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import React from 'react';

export default function HeartToggle({ children, className }: { children: React.ReactElement; className: string }) {
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const { loved_only } = data as unknown as {
    loved_only: boolean;
  };
  return (
    <button
      type='button'
      className={className}
      onClick={() => {
        fireEvent({
          ...data,
          loved_only: !loved_only,
        } as unknown as EventsData);
      }}
    >
      {children}
    </button>
  );
}
