import React from 'react';

import { Events, EventsData } from '@/_typings/events';

export default function useEvent(eventName: Events) {
  const [data, setData] = React.useState({} as EventsData);

  const onEvent = React.useCallback((e: CustomEvent) => setData(e.detail as EventsData), []);

  React.useEffect(() => {
    document.addEventListener(eventName.toString(), onEvent as EventListener, false);
    return () => document.removeEventListener(eventName.toString(), onEvent as EventListener, false);
  }, [eventName]);

  const fireEvent = React.useCallback(
    (data: EventsData = {}) => {
      document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    },
    [eventName],
  );

  return { data, fireEvent };
}

export { Events } from '@/_typings/events';
export type { EventsData } from '@/_typings/events';
export { NotificationCategory } from '@/_typings/events';
