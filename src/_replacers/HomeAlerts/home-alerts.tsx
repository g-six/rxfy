'use client';
import { ReactElement, Fragment, cloneElement, useState, useCallback, useEffect } from 'react';
import { Transition } from '@headlessui/react';

import { replacers } from '@/_helpers/constantsReplacers';
import { ReplacerPageProps, HOME_ALERTS_DISMISS_TIMEOUT } from '@/_typings/forms';
import { getUserData } from '@/_helpers/storeCore';
import { searchByClasses } from '@/_utilities/checkFnUtils';
import { getDismissSavedSearch, setDismissSavedSearch } from '@/_helpers/store';
import { transformMatchingElements } from '@/_helpers/findElements';

import useEvent, { Events } from '@/hooks/useEvent';
import HomeAlertsStep1 from '@/_replacers/HomeAlerts/home-alerts-step1';
import HomeAlertsStep2 from '@/_replacers/HomeAlerts/home-alerts-step2';
import HomeAlertsSuccess from '@/_replacers/HomeAlerts/home-alerts-success';
import HomeAlertsIcon from '@/_replacers/HomeAlerts/home-alerts-icon';

export default function HomeAlertsReplacer({ nodes, agent }: ReplacerPageProps) {
  const user = getUserData();
  const timeNow = Date.now();
  const timeDismiss = getDismissSavedSearch();
  const dismissTimeout = timeNow - (!timeDismiss ? 0 : timeDismiss);

  const eventHookDismiss = useEvent(Events.HomeAlertDismiss);

  const showIcon = dismissTimeout < HOME_ALERTS_DISMISS_TIMEOUT && typeof window !== 'undefined';
  const [doHide, setHide] = useState(showIcon);

  const onDismiss = useCallback(() => {
    setDismissSavedSearch();
    setHide(true);
    eventHookDismiss.fireEvent({ time: Date.now(), show: false });
  }, [eventHookDismiss]);

  useEffect(() => {
    if (eventHookDismiss && eventHookDismiss.data.show) {
      setHide(false);
    }
  }, [eventHookDismiss]);

  const isLoggedIn = user && user?.user?.id;

  const matches = [
    {
      searchFn: searchByClasses(['ha-step-1']),
      transformChild: (child: ReactElement) => {
        return (
          <HomeAlertsStep1
            child={cloneElement(child, { ...child.props })}
            agent={agent}
            user={user}
            onClose={() => onDismiss()}
            showIcon={doHide}
            isLoggedIn={isLoggedIn}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['ha-step-2']),
      transformChild: (child: ReactElement) => {
        return (
          <HomeAlertsStep2
            child={cloneElement(child, { ...child.props })}
            agent={agent}
            user={user}
            onClose={() => onDismiss()}
            showIcon={doHide}
            isLoggedIn={isLoggedIn}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['ha-step-3']),
      transformChild: (child: ReactElement) => {
        return (
          <HomeAlertsSuccess child={cloneElement(child, { ...child.props })} agent={agent} user={user} onClose={() => onDismiss()} isLoggedIn={isLoggedIn} />
        );
      },
    },
    {
      searchFn: searchByClasses(['ha-icon']),
      transformChild: (child: ReactElement) => {
        return (
          <HomeAlertsIcon
            child={cloneElement(child, { ...child.props })}
            agent={agent}
            user={user}
            onClose={() => onDismiss()}
            showIcon={doHide}
            isLoggedIn={isLoggedIn}
          />
        );
      },
    },
  ];

  return (
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
      <div className={replacers.homeAlertsWrapper}>{transformMatchingElements(nodes, matches)}</div>
    </Transition>
  );
}
