'use client';
import { useState, Fragment, useEffect } from 'react';
import { Transition } from '@headlessui/react';

import { ReplacerHomeAlerts } from '@/_typings/forms';
// import { setDismissSavedSearch } from '@/_helpers/store';
import useEvent, { Events } from '@/hooks/useEvent';
import { setData } from '@/_utilities/data-helpers/local-storage-helper';

export default function HomeAlertsSuccess({ child }: ReplacerHomeAlerts) {
  const eventHook = useEvent(Events.HomeAlertSuccess);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (eventHook?.data && Object.keys(eventHook.data).length) {
      setShow(!!eventHook.data.show);
      if (!!eventHook.data.show) {
        setTimeout(() => {
          eventHook.fireEvent({ show: false });
          setTimeout(() => {
            setData('dismissSavedSearch', { dismissed_at: new Date().toISOString() });
          }, 5);
        }, 3000);
      }
    }
  }, [eventHook]);

  return !show ? (
    <></>
  ) : (
    <Transition
      key='confirmation'
      show={true}
      as={Fragment}
      enter='transform ease-out duration-300 transition'
      enterFrom='translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'
      enterTo='translate-y-0 opacity-100 sm:translate-x-0'
      leave='transition ease-in duration-100'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
    >
      <div className={'ha-success'}>{child}</div>
    </Transition>
  );
}
