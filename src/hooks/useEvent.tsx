import React from 'react';
import { Events, EventsData } from '@/_typings/events';

export default function useEvent(eventName: Events, onlyFire?: boolean): { data?: EventsData; fireEvent: (data: EventsData) => void } {
  const [data, setData] = React.useState({} as EventsData);

  const onEvent = React.useCallback(
    (e: CustomEvent) => {
      if (!onlyFire) {
        const newData = e.detail as EventsData;
        newData.metadata = Object.assign({}, data.metadata, newData.metadata);
        setData(newData);
      }
    },
    [onlyFire, data],
  );

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

  return !onlyFire ? { data, fireEvent } : { fireEvent };
}

export { Events } from '@/_typings/events';
export type { EventsData } from '@/_typings/events';
export { NotificationCategory } from '@/_typings/events';
