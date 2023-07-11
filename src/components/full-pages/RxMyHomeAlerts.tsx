'use client';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { fireCustomEvent } from '@/_helpers/functions';
import MyHomeAlertDeleteModalWrapper from '@/_replacers/MyHomeAlerts/MyHomeAlertDeleteModalWrapper';
import MyHomeAlertModalWrapper from '@/_replacers/MyHomeAlerts/MyHomeAlertModalWrapper';
import MyHomeAlertsList from '@/_replacers/MyHomeAlerts/MyHomeAlertsList';
import { AgentData } from '@/_typings/agent';
import { Events } from '@/_typings/events';
import { classNames } from '@/_utilities/html-helper';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, ReactNode, cloneElement } from 'react';

type Props = {
  child: ReactNode;
  'agent-data': AgentData;
  className: string;
};

export default function RxMyHomeAlerts({ child, className, ...p }: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['new-home-alert-button']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            fireCustomEvent({ show: true, message: 'New' }, Events.MyHomeAlertsModal);
          },
        });
      },
    },
    {
      searchFn: searchByClasses(['all-home-alerts']),
      transformChild: (child: ReactElement) => {
        return <MyHomeAlertsList child={child} agent_data={p['agent-data']} />;
      },
    },
    {
      searchFn: searchByClasses(['new-home-alert-wrapper']),
      transformChild: (child: ReactElement) => {
        return <MyHomeAlertModalWrapper agent-data={p['agent-data']} child={child} />;
      },
    },
    {
      searchFn: searchByClasses(['ha-delete-modal-wrapper']),
      transformChild: (child: ReactElement) => {
        return <MyHomeAlertDeleteModalWrapper agent_data={p['agent-data']} child={child} />;
      },
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
