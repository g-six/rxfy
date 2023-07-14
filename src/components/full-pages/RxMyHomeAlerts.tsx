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
  const onSave = (updated: SavedSearch) => {
    if (agent_data) {
      console.log({ agent_data });
      const { customers } = agent_data;
      if (customers) {
        customers.forEach(customer => {
          customer.saved_searches?.forEach((saved, idx) => {
            if (saved.id === updated.id && customer.saved_searches) {
              const { dwelling_types, ...updates } = updated;
              customer.saved_searches[idx] = {
                ...customer.saved_searches[idx],
                ...updates,
              };
            }
          });
        });
        setAgentData({
          ...agent_data,
          customers,
        });
      }
      fireEvent({
        reload: true,
      });
    }
  };

  const matches: tMatch[] = [
    {
      searchFn: searchById('btn-new-home-alert'),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            console.log('clo');
            fireCustomEvent({ show: true, message: 'New' }, Events.MyHomeAlertsModal);
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
        return <MyHomeAlertModalWrapper agent-data={p['agent-data']} child={child} onSave={onSave} />;
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
    console.log(p['agent-data'], agent_data);
  }, [agent_data]);
  React.useEffect(() => {
    setAgentData(p['agent-data']);
  }, []);

  return <>{transformMatchingElements(child, matches)}</>;
}
