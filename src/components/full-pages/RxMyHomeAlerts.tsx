'use client';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { fireCustomEvent } from '@/_helpers/functions';
import MyHomeAlertDeleteModalWrapper from '@/_replacers/MyHomeAlerts/MyHomeAlertDeleteModalWrapper';
import MyHomeAlertModalWrapper from '@/_replacers/MyHomeAlerts/MyHomeAlertModalWrapper';
import MyHomeAlertsList from '@/_replacers/MyHomeAlerts/MyHomeAlertsList';
import { AgentData } from '@/_typings/agent';
import { Events } from '@/_typings/events';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { searchByClasses, searchByProp } from '@/_utilities/rx-element-extractor';
import useEvent from '@/hooks/useEvent';

import React, { ReactElement, ReactNode, cloneElement } from 'react';

type Props = {
  child: ReactNode;
  'agent-data': AgentData;
  className: string;
};

export default function RxMyHomeAlerts({ child, className, ...p }: Props) {
  const { data, fireEvent } = useEvent(Events.MyHomeAlertsModal);
  const [agent_data, setAgentData] = React.useState<AgentData>();

  const matches: tMatch[] = [
    {
      searchFn: searchByProp('data-field', 'new_alert'),
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
      searchFn: searchByProp('data-field', 'empty_state'),
      transformChild: (child: ReactElement) => {
        const { agent_customer_id } = getData('viewing_customer') as unknown as {
          agent_customer_id: number;
        };
        const [customer] = p['agent-data']?.customers?.filter(customer => customer.agent_customer_id === agent_customer_id) || [];
        let show = data?.show !== true;

        if (customer && customer.saved_searches && customer.saved_searches.length) {
          show = false;
        }

        return cloneElement(child, {
          className: show ? child.props.className : 'hidden',
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
