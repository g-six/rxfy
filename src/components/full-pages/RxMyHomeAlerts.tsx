'use client';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { fireCustomEvent } from '@/_helpers/functions';
import MyHomeAlertDeleteModalWrapper from '@/_replacers/MyHomeAlerts/MyHomeAlertDeleteModalWrapper';
import MyHomeAlertModalWrapper from '@/_replacers/MyHomeAlerts/MyHomeAlertModalWrapper';
import MyHomeAlertsList from '@/_replacers/MyHomeAlerts/MyHomeAlertsList';
import { AgentData } from '@/_typings/agent';
import { Events } from '@/_typings/events';
import { SavedSearch } from '@/_typings/saved-search';
import { searchByClasses, searchById } from '@/_utilities/rx-element-extractor';
import useEvent from '@/hooks/useEvent';

import React, { ReactElement, ReactNode, cloneElement } from 'react';

type Props = {
  child: ReactNode;
  'agent-data': AgentData;
  className: string;
};

export default function RxMyHomeAlerts({ child, className, ...p }: Props) {
  const { fireEvent } = useEvent(Events.MyHomeAlertsModal);
  const [agent_data, setAgentData] = React.useState<AgentData>();

  const matches: tMatch[] = [
    {
      searchFn: searchById('btn-new-home-alert'),
      transformChild: (child: ReactElement) => {
        return cloneElement(<button type='button' />, {
          ...child.props,
          onClick: () => {
            fireCustomEvent({ show: true, message: 'New', alertData: {} }, Events.MyHomeAlertsModal);
          },
        });
      },
    },
    {
      searchFn: searchByClasses(['all-home-alerts']),
      transformChild: (child: ReactElement) => {
        return <MyHomeAlertsList child={child} agent_data={agent_data as unknown as AgentData} />;
      },
    },
    {
      searchFn: searchByClasses(['new-home-alert-wrapper']),
      transformChild: (child: ReactElement) => {
        return (
          <MyHomeAlertModalWrapper
            agent-data={p['agent-data']}
            child={child}
            onSave={() => {
              fireEvent({ reload: true });
            }}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['ha-delete-modal-wrapper']),
      transformChild: (child: ReactElement) => {
        return <MyHomeAlertDeleteModalWrapper agent_data={p['agent-data']} child={child} />;
      },
    },
  ];

  React.useEffect(() => {
    setAgentData(p['agent-data']);
  }, []);

  return <>{transformMatchingElements(child, matches)}</>;
}
