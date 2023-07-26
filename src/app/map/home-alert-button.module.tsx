'use client';
import React from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';

export default function HomeAlertButton({ children, className }: { children: React.ReactElement; className: string }) {
  const { fireEvent, data } = useEvent(Events.MyHomeAlertsForm);
  const [hidden, toggle] = React.useState(data?.show);

  React.useEffect(() => {
    toggle(data?.show);
  }, [data]);

  return hidden ? (
    <></>
  ) : (
    <button
      type='button'
      className={className}
      onClick={() => {
        fireEvent({
          show: true,
          step: 1,
        } as unknown as EventsData);
      }}
    >
      {children}
    </button>
  );
}
