'use client';

import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import React from 'react';

export default function RxToggleSwitch(p: {
  children?: React.ReactElement;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  'data-field'?: string;
}) {
  const eventHandler = useEvent(Events.GenericEvent);
  const [is_toggled, toggle] = React.useState<'on' | 'off'>();
  return (
    <div
      {...p}
      onClick={(evt: React.SyntheticEvent) => {
        if (p['data-field']) {
          eventHandler.fireEvent({
            [p['data-field']]: is_toggled === 'on' ? 'off' : 'on',
          } as unknown as EventsData);
        }
        toggle(is_toggled === 'on' ? 'off' : 'on');
        return evt;
      }}
      data-toggled={is_toggled}
    >
      {p.children}
    </div>
  );
}
