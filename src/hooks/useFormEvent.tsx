import React from 'react';

import { deepEqual } from '@/_helpers/functions';
import { ValueInterface } from '@/_typings/ui-types';
import { Events, PrivateListingData, FormData } from '@/_typings/events';

export interface ImagePreview extends File {
  preview: string;
}

function throwIfNotFormData(value: any): asserts value is FormData {
  const v = value as FormData;
  const o = v as unknown as object;
  if (o && typeof o === 'object' && Object.keys(o).length) return;
  throw 'The arg. is not of FormData or its child!';
}

export function getValueByKey(key: string, data: any) {
  const obj = data as Object;
  const keyIndex =
    obj && Object.keys(obj).length
      ? Object.keys(obj).reduce((foundIndex, k, i) => {
          return k === key ? i + 1 : foundIndex;
        }, 0)
      : 0;
  return keyIndex && obj && Object.keys(obj).length ? Object.values(obj)[keyIndex - 1] : null;
}

export function setMultiSelectValue(val: ValueInterface, currentVal: ValueInterface[]) {
  const isIn = currentVal?.some((item: ValueInterface) => item.value === val.value);
  const newArr = isIn ? currentVal?.filter((item: ValueInterface) => item.value !== val.value) : [...(currentVal ?? []), val];
  return [...newArr];
}

export default function useFormEvent<EventsFormData>(eventName: Events): { data?: EventsFormData; fireEvent: (data: EventsFormData) => void } {
  const [data, setData] = React.useState({} as EventsFormData);

  const fireEvent = React.useCallback(
    (data: EventsFormData) => {
      throwIfNotFormData(data);
      document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    },
    [eventName],
  );

  const onEvent = React.useCallback(
    (e: CustomEvent) => {
      const newData = Object.assign({}, data, e.detail);

      // we want to have diff of the objects (base and full)
      // to have data of the form only (objForm)
      const objBase = e.detail as FormData;
      const objFull = newData as EventsFormData;
      const objForm = Object.keys(objFull as object).reduce((obj, key) => {
        if (!Object.keys(objBase).includes(key)) {
          const o = objFull as unknown as object;
          const keyIndex = Object.keys(o).reduce((foundIndex, k, i) => {
            return k === key ? i + 1 : foundIndex;
          }, 0);
          const value = keyIndex ? Object.values(o)[keyIndex - 1] : '';
          obj = Object.assign({}, { [key]: value });
        }
        return obj;
      }, {});

      // if this hook listens a new subscriber, we broadcast the current state of the form
      if (newData.subscribe && Object.keys(objForm).length) {
        fireEvent(Object.assign({}, objForm, { subscribe: true }) as EventsFormData);
      } else if (!deepEqual(newData, data)) {
        setData(prev => ({ ...prev, ...e.detail, subscribe: false }));
      }
    },
    [data, fireEvent],
  );

  React.useEffect(() => {
    document.addEventListener(eventName.toString(), onEvent as EventListener, false);
    return () => document.removeEventListener(eventName.toString(), onEvent as EventListener, false);
  }, [eventName, onEvent]);

  React.useEffect(() => {
    // we fire an event here only one time
    // to communicate that there is another listener to this form state
    fireEvent({ subscribe: true } as EventsFormData);
  }, [fireEvent]);

  return { data, fireEvent };
}

export { Events } from '@/_typings/events';
export type { EventsData, PrivateListingData } from '@/_typings/events';
export { NotificationCategory } from '@/_typings/events';
