'use client';
import { ReactElement, Fragment, cloneElement, useState, useCallback, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import axios from 'axios';

import { ReplacerPageProps, HOME_ALERTS_DISMISS_TIMEOUT } from '@/_typings/forms';
import { searchByClasses } from '@/_utilities/checkFnUtils';
import { transformMatchingElements } from '@/_helpers/findElements';

import useEvent, { Events } from '@/hooks/useEvent';
import HomeAlertsStep1 from '@/_replacers/HomeAlerts/home-alerts-step1';
import HomeAlertsStep2 from '@/_replacers/HomeAlerts/home-alerts-step2';
import HomeAlertsSuccess from '@/_replacers/HomeAlerts/home-alerts-success';
import HomeAlertsIcon from '@/_replacers/HomeAlerts/home-alerts-icon';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';

export default function HomeAlertsReplacer({ nodes, agent }: ReplacerPageProps) {
  const timeNow = Date.now();
  const timeDismiss = getData('dismissSavedSearch');
  const dismissTimeout = timeNow - (!timeDismiss ? 0 : timeDismiss);

  const eventHookDismiss = useEvent(Events.HomeAlertDismiss);

  const showIcon = dismissTimeout < HOME_ALERTS_DISMISS_TIMEOUT && typeof window !== 'undefined';
  const [doHide, setHide] = useState(showIcon);

  const onDismiss = useCallback(() => {
    setData('dismissSavedSearch');
    setHide(true);
    eventHookDismiss.fireEvent({ time: Date.now(), show: false });
  }, [eventHookDismiss]);

  useEffect(() => {
    if (eventHookDismiss && eventHookDismiss.data.show) {
      setHide(false);
    }
  }, [eventHookDismiss]);

  const matches = [
    {
      searchFn: searchByClasses(['ha-step-1']),
      transformChild: (child: ReactElement) => {
        return <HomeAlertsStep1 child={cloneElement(child, { ...child.props })} agent={agent} onClose={() => onDismiss()} showIcon={doHide} />;
      },
    },
    {
      searchFn: searchByClasses(['ha-step-2']),
      transformChild: (child: ReactElement) => {
        return <HomeAlertsStep2 child={cloneElement(child, { ...child.props })} agent={agent} onClose={() => onDismiss()} showIcon={doHide} />;
      },
    },
    {
      searchFn: searchByClasses(['ha-step-3']),
      transformChild: (child: ReactElement) => {
        return <HomeAlertsSuccess child={cloneElement(child, { ...child.props })} agent={agent} onClose={() => onDismiss()} />;
      },
    },
    {
      searchFn: searchByClasses(['ha-icon']),
      transformChild: (child: ReactElement) => {
        return <HomeAlertsIcon child={cloneElement(child, { ...child.props })} agent={agent} onClose={() => onDismiss()} showIcon={doHide} />;
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
      <section className='absolute top-24 z-50 left-1/2 -translate-x-1/2'>{transformMatchingElements(nodes, matches)}</section>
    </Transition>
  );
}
