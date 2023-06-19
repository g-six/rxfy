'use client';
import { ReactElement, Fragment, cloneElement } from 'react';
import { Transition } from '@headlessui/react';

import { ReplacerPageProps, HOME_ALERTS_DISMISS_TIMEOUT } from '@/_typings/forms';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';

import HomeAlertsStep1 from '@/_replacers/HomeAlerts/home-alerts-step1';
import HomeAlertsStep2 from '@/_replacers/HomeAlerts/home-alerts-step2';
import HomeAlertsSuccess from '@/_replacers/HomeAlerts/home-alerts-success';
import HomeAlertsIcon from '@/_replacers/HomeAlerts/home-alerts-icon';

export default function HomeAlertsReplacer({ nodes, agent, nodeClassName }: ReplacerPageProps) {
  const matches = [
    {
      searchFn: searchByClasses(['ha-step-1']),
      transformChild: (child: ReactElement) => {
        return <HomeAlertsStep1 child={cloneElement(child, { ...child.props })} agent={agent} />;
      },
    },
    {
      searchFn: searchByClasses(['ha-step-2']),
      transformChild: (child: ReactElement) => {
        return <HomeAlertsStep2 child={cloneElement(child, { ...child.props })} agent={agent} />;
      },
    },
    {
      searchFn: searchByClasses(['ha-step-3']),
      transformChild: (child: ReactElement) => {
        return <HomeAlertsSuccess child={cloneElement(child, { ...child.props })} agent={agent} />;
      },
    },
    {
      searchFn: searchByClasses(['ha-icon']),
      transformChild: (child: ReactElement) => {
        return <HomeAlertsIcon child={cloneElement(child, { ...child.props })} agent={agent} />;
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
      <section className={nodeClassName}>{transformMatchingElements(nodes, matches)}</section>
    </Transition>
  );
}
