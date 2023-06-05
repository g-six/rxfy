import React from 'react';

import { Events, PrivateListingData, FormData } from '@/_typings/events';
import { deepEqual } from '@/_helpers/functions';

export interface ImagePreview extends File {
  preview: string;
}

function throwIfNotFormData(value: any): asserts value is FormData {
  const v = value as FormData;
  const o = v as unknown as object;
  if (o && typeof o === 'object' && Object.keys(o).length) return;
  throw 'The arg. is not of FormData or its child!';
}

export default function useFormEvent<EventsFormData>(eventName: Events): { data?: EventsFormData; fireEvent: (data: EventsFormData) => void } {
  const [data, setData] = React.useState({} as EventsFormData);

  const onEvent = React.useCallback(
    (e: CustomEvent) => {
      const newData = Object.assign({}, data, e.detail);
      if (!deepEqual(newData, data)) {
        setData(prev => ({ ...prev, ...e.detail }));
      }
    },
    [data],
  );

  React.useEffect(() => {
    document.addEventListener(eventName.toString(), onEvent as EventListener, false);
    return () => document.removeEventListener(eventName.toString(), onEvent as EventListener, false);
  }, [eventName, onEvent]);

  const fireEvent = React.useCallback(
    (data: EventsFormData) => {
      throwIfNotFormData(data);
      document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    },
    [eventName],
  );

  return { data, fireEvent };
}

export { Events } from '@/_typings/events';
export type { EventsData, PrivateListingData } from '@/_typings/events';
export { NotificationCategory } from '@/_typings/events';
