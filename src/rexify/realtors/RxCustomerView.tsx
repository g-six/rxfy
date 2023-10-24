'use client';
import React from 'react';
import { LovedPropertyDataModel } from '@/_typings/property';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { AgentData } from '@/_typings/agent';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { useSearchParams } from 'next/navigation';
import { setData } from '@/_utilities/data-helpers/local-storage-helper';
import { CustomerRecord } from '@/_typings/customer';
import ClientDashboardIterator from './ClientDashboardIterator.module';

type Props = {
  children: React.ReactElement;
  id?: string;
  agent?: AgentData;
  className?: string;
};

export default function RxCustomerView(p: Props) {
  const [hydrated, setHydrated] = React.useState(false);
  const searchParams = useSearchParams();
  const session = useEvent(Events.LoadUserSession);
  const lovers = useEvent(Events.LoadLovers);
  const { data: confirmation, fireEvent: confirmUnlove } = useEvent(Events.GenericEvent);
  const { confirm_unlove } = confirmation as unknown as {
    confirm_unlove?: boolean;
    id?: number;
  };

  const selectPropertyEvt = useEvent(Events.SelectCustomerLovedProperty);
  const [properties, setProperties] = React.useState<LovedPropertyDataModel[]>([]);
  const [property, selectProperty] = React.useState<LovedPropertyDataModel>();
  const [agent, setAgent] = React.useState<AgentData>(session.data as unknown as AgentData);
  const [active_tab, setSelectedTab] = React.useState<string>('Tab 1');
  const onSelectProperty = (property: LovedPropertyDataModel) => {
    selectPropertyEvt.fireEvent(property as unknown as EventsData);
  };

  const loadData = (r?: unknown) => {
    const { id, customers, ...selections } = agent as unknown as AgentData;
    const tabs = selections as unknown as {
      [key: string]: string;
    };
    if (tabs['active-crm-saved-homes-view']) setSelectedTab(tabs['active-crm-saved-homes-view']);
    if (id) {
      const customer_id = searchParams.get('customer') as unknown as number;

      if (customer_id) {
        if (customers && customers.length) {
          const [record] = customers.filter((c: CustomerRecord) => {
            return c.id === Number(searchParams.get('customer'));
          });
          if (record) {
            const { email, phone_number, first_name, last_name, full_name } = record;
            setData(
              'viewing_customer',
              JSON.stringify({
                email,
                phone_number,
                first_name,
                last_name,
                full_name,
                agent: {
                  agent_id: agent.agent_id,
                  metatags: {
                    profile_slug: agent.metatags.profile_slug,
                  },
                },
              }),
            );
          }
        }
        getLovedHomes(customer_id).then(data => {
          if (data.records) {
            setProperties(data.records);
            lovers.fireEvent(data as unknown as EventsData);
            let default_property = false;
            data.records.forEach((property: LovedPropertyDataModel) => {
              if (property.cover_photo && !default_property) {
                default_property = true;
                onSelectProperty(property);
              }
            });
          }
        });
      }
    }
  };

  React.useEffect(() => {
    setAgent(session.data as unknown as AgentData);
    const tabs = session.data as unknown as {
      [key: string]: string;
    };
    if (tabs['active-crm-saved-homes-view']) setSelectedTab(tabs['active-crm-saved-homes-view']);
  }, [session]);

  React.useEffect(() => {
    if (selectPropertyEvt.data) {
      selectProperty(selectPropertyEvt.data as unknown as LovedPropertyDataModel);
    }
  }, [selectPropertyEvt.data]);

  React.useEffect(() => {
    setHydrated(true);
  }, [properties]);

  React.useEffect(() => {
    loadData();
  }, [agent]);

  React.useEffect(() => {
    if (!agent.id && p.agent?.id) {
      setAgent(p.agent);
    }
  }, []);

  return (
    <div {...{ ...p, agent: agent.id }}>
      {hydrated ? (
        <ClientDashboardIterator
          {...p}
          confirm={confirm_unlove}
          onCancel={() => {
            confirmUnlove({});
          }}
          onConfirm={() => {
            if (property?.love) {
              confirmUnlove({
                id: property.love,
                confirmed_action: 'unlove',
              } as unknown as EventsData);
            }
          }}
          reload={loadData}
          property={property}
          agent={agent}
          properties={properties}
          active-tab={active_tab}
          onClickChangeCompareStats={() => {
            document.getElementById('customer-view-modal-compare-filters')?.classList.add('is-really-visible');
          }}
        >
          {p.children}
        </ClientDashboardIterator>
      ) : (
        p.children
      )}
    </div>
  );
}
