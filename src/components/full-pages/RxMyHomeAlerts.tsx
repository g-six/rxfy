'use client';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { fireCustomEvent } from '@/_helpers/functions';
import MyHomeAlertModalWrapper from '@/_replacers/MyHomeAlerts/MyHomeAlertModalWrapper';
import MyHomeAlertsList from '@/_replacers/MyHomeAlerts/MyHomeAlertsList';
import { AgentData } from '@/_typings/agent';
import { Events } from '@/_typings/events';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, ReactNode, cloneElement } from 'react';

type Props = {
  child: ReactNode;
  agent_data: AgentData;
  className: string;
};

export default function RxMyHomeAlerts({ child, agent_data, className }: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['new-home-alert-button']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            fireCustomEvent({ show: true }, Events.MyHomeAlertsModal);
          },
        });
      },
    },
    {
      searchFn: searchByClasses(['all-home-alerts']),
      transformChild: (child: ReactElement) => {
        return <MyHomeAlertsList child={child} />;
      },
    },
    {
      searchFn: searchByClasses(['new-home-alert-wrapper']),
      transformChild: (child: ReactElement) => {
        return <MyHomeAlertModalWrapper child={child} />;
      },
    },
  ];
  return <div className={className}>{transformMatchingElements(child, matches)}</div>;
}