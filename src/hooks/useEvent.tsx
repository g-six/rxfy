import React from 'react';

import { Events, EventsData } from '@/_typings/events';

export default function useEvent(eventName: Events, onlyFire?: boolean): { data?: EventsData; fireEvent: (data: EventsData) => void } {
  const [data, setData] = React.useState({} as EventsData);

  const onEvent = React.useCallback(
    (e: CustomEvent) => {
      if (!onlyFire) {
        // This is the source of a major bug.
        // How are we supposed to reset the data (ie. erase it so that it is {})?
        //    setData(prev => ({ ...prev, ...e.detail }));

        // Fix for the above line
        setData(prev => (Object.keys(e.detail).length > 0 ? { ...prev, ...e.detail } : {}));
      }
    },
    [onlyFire],
  );

  React.useEffect(() => {
    document.addEventListener(eventName.toString(), onEvent as EventListener, false);
    return () => document.removeEventListener(eventName.toString(), onEvent as EventListener, false);
  }, [eventName, onEvent]);

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
