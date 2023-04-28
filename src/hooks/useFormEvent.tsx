import React from 'react';
import { Events } from '@/_typings/events';

export interface EventsFormData {
  reset?: boolean;
  beds?: number;
  baths?: number;
  dwelling_types?: string[];
}
export default function useFormEvent(eventName: Events): { data?: EventsFormData; fireEvent: (data: EventsFormData) => void } {
  const [data, setData] = React.useState({} as EventsFormData);

  const onEvent = React.useCallback((e: CustomEvent) => {
    setData(prev => ({ ...prev, ...e.detail }));
  }, []);

  React.useEffect(() => {
    document.addEventListener(eventName.toString(), onEvent as EventListener, false);
    return () => document.removeEventListener(eventName.toString(), onEvent as EventListener, false);
  }, [eventName]);

  const fireEvent = React.useCallback(
    (data: EventsFormData = {}) => {
      document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    },
    [eventName],
  );

  return { data, fireEvent };
}

export { Events } from '@/_typings/events';
export type { EventsData } from '@/_typings/events';
export { NotificationCategory } from '@/_typings/events';
