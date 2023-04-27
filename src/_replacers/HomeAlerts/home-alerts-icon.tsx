'use client';
import { cloneElement, Fragment, ReactElement, useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/searchFnUtils';

import { ReplacerHomeAlerts } from '@/_typings/forms';
import Cookies from 'js-cookie';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import useHomeAlert from '@/hooks/useHomeAlert';
import { HomeAlertStep } from '@/_typings/home-alert';

export default function HomeAlertsIcon({ agent, child }: ReplacerHomeAlerts) {
  const hook = useHomeAlert(agent);
  const [show, toggleShow] = useState(false);
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
              let step: HomeAlertStep = HomeAlertStep.STEP_1;
              if (getData('dismissSavedSearch')) {
                const d = getData('dismissSavedSearch') as unknown as { step: number };
                step = d.step;
              } else if (Cookies.get('session_key')) {
                step = HomeAlertStep.STEP_1;
              }
              hook.onAction({ step, url: full_url });
            },
          },
          child.props.children,
        ),
    },
  ];

  useEffect(() => {
    if (getData('dismissSavedSearch') && getData('dismissSavedSearch') !== null) {
      const { dismissed_at } = getData('dismissSavedSearch') as unknown as { dismissed_at: string; step: number };
      toggleShow(dismissed_at !== undefined);
    } else {
      toggleShow(false);
    }
  }, [hook]);

  useEffect(() => {
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
    >
      <div className='ha-success'>{transformMatchingElements([child], matches)}</div>
    </Transition>
  );
}
