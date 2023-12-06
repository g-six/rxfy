'use client';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { fireCustomEvent } from '@/_helpers/functions';
import MyHomeAlertDeleteModalWrapper from '@/_replacers/MyHomeAlerts/MyHomeAlertDeleteModalWrapper';
import MyHomeAlertModalWrapper from '@/_replacers/MyHomeAlerts/MyHomeAlertModalWrapper';
import MyHomeAlertsList from '@/_replacers/MyHomeAlerts/MyHomeAlertsList';
import { AgentData } from '@/_typings/agent';
import { Events, EventsData } from '@/_typings/events';
import { SavedSearchOutput } from '@/_typings/saved-search';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { searchByClasses, searchByPartOfClass, searchByProp } from '@/_utilities/rx-element-extractor';
import { SavedHomesPropertyList } from '@/app/[slug]/client-dashboard/property-list.module';
import useEvent from '@/hooks/useEvent';

import React, { ReactElement, ReactNode, cloneElement } from 'react';
import RxNotifications from '../RxNotifications';

type Props = {
  child: ReactNode;
  'agent-data': AgentData;
  className: string;
  records?: SavedSearchOutput[];
};

export default function RxMyHomeAlerts({ child, className, ...p }: Props) {
  const { data, fireEvent } = useEvent(Events.MyHomeAlertsModal);
  const [agent_data, setAgentData] = React.useState<AgentData>();
  const [records, setRecords] = React.useState<SavedSearchOutput[]>([]);

  const matches: tMatch[] = [
    {
      searchFn: searchByProp('data-field', 'new_alert'),
      transformChild: (child: ReactElement) => {
        return cloneElement(<button type='button' />, {
          ...child.props,
          onClick: () => {
            fireCustomEvent({ show: true, message: 'New', alertData: {} }, Events.MyHomeAlertsModal);
            document.querySelector('[data-field="empty_state"]')?.remove();
          },
        });
      },
    },
    {
      searchFn: searchByProp('data-field', 'empty_state'),
      transformChild: (child: ReactElement) => {
        if (data) {
          const { records } = data as unknown as {
            records: unknown[];
          };
          if (records && records.length) {
            return <></>;
          }
        }
        const current_customer = getData('viewing_customer') as unknown as {
          agent_customer_id: number;
        };
        if (current_customer?.agent_customer_id) {
          if (p['agent-data']?.customers && Array.isArray(p['agent-data'].customers)) {
            const [customer] = p['agent-data']?.customers?.filter(customer => customer.agent_customer_id === current_customer.agent_customer_id) || [];
            let show = data?.show !== true;

            if (customer && customer.saved_searches && customer.saved_searches.length) {
              show = false;
            }

            return cloneElement(child, {
              className: show ? child.props.className : 'hidden',
            });
          }
        }
        return child;
      },
    },
    {
      searchFn: searchByPartOfClass(['all-home-alerts']),
      transformChild: (child: ReactElement) => {
        return <MyHomeAlertsList child={child} agent_data={agent_data as unknown as AgentData} />;
      },
    },
    {
      searchFn: searchByProp('data-panel', 'properties_column'),
      transformChild: (child: ReactElement) => {
        return (
          <SavedHomesPropertyList {...child.props} agent={agent_data}>
            {child.props.children}
          </SavedHomesPropertyList>
        );
        // return <MyHomeAlertsList child={child} agent_data={agent_data as unknown as AgentData} />;
      },
    },
    {
      searchFn: searchByClasses(['new-home-alert-wrapper']),
      transformChild: (child: ReactElement) => {
        return data?.show ? (
          <MyHomeAlertModalWrapper
            agent-data={p['agent-data']}
            child={child}
            onSave={results => {
              fireEvent({ reload: true, show: false, alertData: results });
            }}
          />
        ) : (
          <></>
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
    const poly = data as { records?: SavedSearchOutput[] };
    console.log(poly);
  }, [data]);

  React.useEffect(() => {
    setAgentData(p['agent-data']);
    if (p.records) {
      fireEvent(p as unknown as EventsData);
      setRecords(p.records);
    }
  }, []);

  return (
    <>
      {transformMatchingElements(child, matches)}
      <RxNotifications />
    </>
  );
}
