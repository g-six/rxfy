'use client';
import { cloneElement, Fragment, ReactElement, useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/searchFnUtils';

import { ReplacerHomeAlerts } from '@/_typings/forms';
import Cookies from 'js-cookie';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import { HomeAlertStep } from '@/_typings/home-alert';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';

export default function HomeAlertsIcon({ agent, child }: ReplacerHomeAlerts) {
  const evt = useEvent(Events.MapHomeAlertToast);
  const { step } = {
    ...evt.data,
  } as unknown as { step: HomeAlertStep };
  const [show, toggleShow] = useState(true);
  const [full_url, setCurrentFullUrl] = useState('');
  const matches = [
    {
      searchFn: searchByClasses(['ha-icon']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          <button type='button' />,
          {
            ...child.props,
            onClick: () => {
              switch (getData('HomeAlertStep') as unknown as number) {
                case HomeAlertStep.DISS_0:
                  evt.fireEvent({
                    step: HomeAlertStep.STEP_0,
                  } as unknown as EventsData);
                  setData('HomeAlertStep', `${HomeAlertStep.STEP_0}`);
                  break;
                case HomeAlertStep.DISS_1:
                  evt.fireEvent({
                    step: HomeAlertStep.STEP_1,
                  } as unknown as EventsData);
                  setData('HomeAlertStep', `${HomeAlertStep.STEP_1}`);
                  break;
                case HomeAlertStep.DISS_2:
                  evt.fireEvent({
                    step: HomeAlertStep.STEP_2,
                  } as unknown as EventsData);
                  setData('HomeAlertStep', `${HomeAlertStep.STEP_2}`);
                  break;
                default:
                  evt.fireEvent({
                    step: HomeAlertStep.STEP_1,
                  } as unknown as EventsData);
                  setData('HomeAlertStep', `${HomeAlertStep.STEP_1}`);
              }
            },
          },
          child.props.children,
        ),
    },
  ];

  useEffect(() => {
    toggleShow(![HomeAlertStep.STEP_1, HomeAlertStep.STEP_2].includes(step));
  }, [step]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentFullUrl(location.href);
    }
    const step = getData('HomeAlertStep');
    if (step !== null) {
      toggleShow(![HomeAlertStep.STEP_1, HomeAlertStep.STEP_2].includes(step));
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
      className={child?.props.className}
    >
      <div className='ha-success'>{transformMatchingElements([child], matches)}</div>
    </Transition>
  );
}
