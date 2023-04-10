'use client';
import { cloneElement, Fragment, ReactElement } from 'react';
import { Transition } from '@headlessui/react';
import { transformMatchingElements } from '@/_helpers/findElements';
import { searchByClasses } from '@/_utilities/checkFnUtils';

import { ReplacerHomeAlerts } from '@/_typings/forms';
import useEvent, { Events } from '@/hooks/useEvent';
import useHomeAlert from '@/hooks/useHomeAlert';

export default function HomeAlertsIcon({ child, agent, user, showIcon }: ReplacerHomeAlerts) {
  const hook = useHomeAlert(user, agent);
  const eventHookDismiss = useEvent(Events.HomeAlertDismiss);

  const matches = [
    {
      searchFn: searchByClasses(['ha-icon']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          child,
          {
            ...child.props,
            onClick: () => {
              if (user && user.jwt) {
                // getUserData
                // hook.onAction(getUserData(), undefined);
              } else {
                eventHookDismiss.fireEvent({ show: true });
              }
            },
          },
          child.props.children,
        ),
    },
  ];

  return !showIcon ? (
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
      <div className={'ha-success'}>{transformMatchingElements([child], matches)}</div>
    </Transition>
  );
}
