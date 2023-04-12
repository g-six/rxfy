'use client';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';

import { ReplacerHomeAlerts } from '@/_typings/forms';
// import { getUserData } from '@/_helpers/storeCore';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import useHomeAlert from '@/hooks/useHomeAlert';
import Cookies from 'js-cookie';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import useEvent, { Events } from '@/hooks/useEvent';
import { HomeAlertStep } from '@/_typings/home-alert';

export default function HomeAlertsStep1({ child, agent }: ReplacerHomeAlerts) {
  const hook = useHomeAlert(agent);
  const eventHookDismiss = useEvent(Events.HomeAlertDismiss);
  const [show, toggleShow] = useState(false);
  const matches = [
    {
      searchFn: searchByClasses(['setup-ha-close']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          child,
          {
            ...child.props,
            onClick: () => {
              hook.onDismiss(HomeAlertStep.STEP_1);
              toggleShow(false);
            },
          },
          child.props.children,
        ),
    },
    {
      searchFn: searchByClasses(['setup-ha-1']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          <button type='button' className={child.props.className || ''} />,
          {
            ...child.props,
            onClick: () => {
              hook.onAction(HomeAlertStep.STEP_2);
            },
          },
          child.props.children,
        ),
    },
  ];

  useEffect(() => {
    if (getData('dismissSavedSearch') && getData('dismissSavedSearch') !== null) {
      const { dismissed_at, show_step } = getData('dismissSavedSearch') as unknown as { show_step: number; dismissed_at?: string };
      toggleShow(show_step === 1 || (!dismissed_at && !show_step));
    }
  }, [hook]);

  useEffect(() => {
    if (eventHookDismiss.data?.show) {
      toggleShow(true);
    }
  }, [eventHookDismiss.data]);

  useEffect(() => {
    if (getData('dismissSavedSearch') !== null) {
      const { dismissed_at } = getData('dismissSavedSearch') as unknown as { dismissed_at?: string };
      if (Cookies.get('session_key') !== undefined && Cookies.get('cid') !== undefined) {
        toggleShow(!dismissed_at);
      } else {
        toggleShow(!dismissed_at);
      }
    }
  }, []);

  return (
    <Transition
      key='confirmation'
      show={show}
      as='div'
      enter='transform ease-out duration-300 transition'
      enterFrom='translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'
      enterTo='translate-y-0 opacity-100 sm:translate-x-0'
      leave='transition ease-in duration-100'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
    >
      {transformMatchingElements([child], matches)}
    </Transition>
  );
}
