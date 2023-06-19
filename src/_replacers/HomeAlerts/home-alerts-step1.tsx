'use client';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';

import { ReplacerHomeAlerts } from '@/_typings/forms';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { HomeAlertStep } from '@/_typings/home-alert';

export default function HomeAlertsStep1({ child, agent }: ReplacerHomeAlerts) {
  const evt = useEvent(Events.MapHomeAlertToast);
  const { step } = {
    ...evt.data,
  } as unknown as { step: HomeAlertStep };
  // const hook = useHomeAlert(agent);
  const [show, toggleShow] = useState(step === undefined && step === HomeAlertStep.STEP_1);
  const [full_url, setCurrentFullUrl] = useState('');
  const matches = [
    {
      searchFn: searchByClasses(['setup-ha-close']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          child,
          {
            ...child.props,
            onClick: () => {
              toggleShow(false);
              evt.fireEvent({
                step: HomeAlertStep.DISS_1,
              } as unknown as EventsData);
              setData('HomeAlertStep', `${HomeAlertStep.DISS_1}`);
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
              evt.fireEvent({
                step: HomeAlertStep.STEP_2,
              } as unknown as EventsData);
              setData('HomeAlertStep', `${HomeAlertStep.STEP_2}`);
            },
          },
          child.props.children,
        ),
    },
  ];

  useEffect(() => {
    toggleShow(step === HomeAlertStep.STEP_1);
  }, [step]);

  useEffect(() => {
    const step = getData('HomeAlertStep');
    if (step !== null) {
      toggleShow(step === HomeAlertStep.STEP_1);
    }
    if (typeof window !== 'undefined') {
      setCurrentFullUrl(location.href);
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
      className={child?.props?.className}
    >
      {transformMatchingElements([child], matches)}
    </Transition>
  );
}
