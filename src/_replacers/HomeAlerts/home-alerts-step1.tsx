'use client';
import React, { ReactElement, cloneElement, Fragment } from 'react';
import { Transition } from '@headlessui/react';

import { ReplacerHomeAlerts } from '@/_typings/forms';
// import { getUserData } from '@/_helpers/storeCore';
import { searchByClasses } from '@/_utilities/checkFnUtils';
import { transformMatchingElements } from '@/_helpers/findElements';
import useHomeAlert from '@/hooks/useHomeAlert';
import Cookies from 'js-cookie';

export default function HomeAlertsStep1({ child, agent, onClose, showIcon }: ReplacerHomeAlerts) {
  const hook = useHomeAlert(/*user, */ agent);

  const matches = [
    {
      searchFn: searchByClasses(['setup-ha-close']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          child,
          {
            ...child.props,
            onClick: () => onClose(),
          },
          child.props.children,
        ),
    },
    {
      searchFn: searchByClasses(['setup-ha-1']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          child,
          {
            ...child.props,
            onClick: () => {
              // hook.onAction(getUserData(), undefined)
            },
          },
          child.props.children,
        ),
    },
  ];

  return showIcon || !Cookies.get('session_key') ? (
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
      {transformMatchingElements([child], matches)}
    </Transition>
  );
}
