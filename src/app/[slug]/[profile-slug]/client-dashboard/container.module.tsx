'use client';
import React from 'react';
import { AgentData } from '@/_typings/agent';
import { CustomerRecord } from '@/_typings/customer';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { setData } from '@/_utilities/data-helpers/local-storage-helper';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { LovedPropertyDataModel, PropertyDataModel } from '@/_typings/property';
import { Events, EventsData } from '@/hooks/useFormEvent';
import useEvent from '@/hooks/useEvent';
import ClientDashboardIterator from '@/rexify/realtors/ClientDashboardIterator.module';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

export default function Container({ agent, children }: { children: React.ReactElement; agent: AgentData }) {
  const router = useRouter();
  const lovers = useEvent(Events.LoadLovers);
  const selectPropertyEvt = useEvent(Events.SelectCustomerLovedProperty);
  const session_key = Cookies.get('session_key');
  const session = useEvent(Events.LoadUserSession);
  const {
    data: { 'active-crm-saved-homes-view': active_tab },
  } = session as unknown as {
    data: {
      'active-crm-saved-homes-view': string;
    };
  };

  const property = selectPropertyEvt.data as unknown as LovedPropertyDataModel;
  const { properties } = lovers.data as unknown as {
    properties: LovedPropertyDataModel[];
  };
  if (!active_tab && property?.id && properties) {
    session.fireEvent({
      ...session.data,
      'active-crm-saved-homes-view': 'Tab 1',
    } as unknown as EventsData);
  }

  const loadData = (r?: unknown) => {
    if (session_key) {
      getUserBySessionKey(session_key, 'customer')
        .then((data: unknown) => {
          setData('viewing_customer', JSON.stringify(data));
          getLovedHomes().then(data => {
            if (data.records) {
              const loved_properties = data.records.map((p: { property: PropertyDataModel; id: number; notes: string }) => {
                return {
                  ...p.property,
                  love: p.id,
                  notes: p.notes,
                  cover_photo: p.property.photos?.[0] ? getImageSized(p.property.photos[0]) : '/images/house-placeholder.png',
                };
              });

              lovers.fireEvent({
                properties: loved_properties,
              } as unknown as EventsData);
              selectPropertyEvt.fireEvent(loved_properties[0] as unknown as EventsData);
            }
          });
        })
        .catch(() => {
          router.push('log-in');
        });
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  return property?.id && properties && active_tab ? (
    <ClientDashboardIterator
      id='SavedHome'
      className={'RxCustomerView-ClientDashboardIterator rexified'}
      onCancel={() => {
        console.log('canceled');
      }}
      onConfirm={console.log}
      onClickChangeCompareStats={console.log}
      reload={console.log}
      property={property}
      properties={properties}
      agent={agent}
      active-tab={active_tab}
    >
      {children}
    </ClientDashboardIterator>
  ) : (
    <>{children}</>
  );
}
