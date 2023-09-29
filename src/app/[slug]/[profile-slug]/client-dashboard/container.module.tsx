'use client';
import React from 'react';
import { AgentData } from '@/_typings/agent';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import { getLovedHomes, loveHome } from '@/_utilities/api-calls/call-love-home';
import { LovedPropertyDataModel, PropertyDataModel } from '@/_typings/property';
import { Events, EventsData } from '@/hooks/useFormEvent';
import useEvent from '@/hooks/useEvent';
import ClientDashboardIterator from '@/rexify/realtors/ClientDashboardIterator.module';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { classNames } from '@/_utilities/html-helper';

function BlankIterator({ agent, children }: { agent: AgentData; children: React.ReactElement }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      const { children, ...props } = c.props;
      if (
        props.className?.indexOf('property-card-wrapper') >= 0 ||
        props.className?.indexOf('propcompare-card') >= 0 ||
        props.className?.indexOf('saved-home-detail-panel') >= 0 ||
        props.className?.indexOf('map-placeholder') >= 0 ||
        props.className?.indexOf('map-property-modal') >= 0
      ) {
        return <div {...props} style={{ backgroundImage: 'none' }} rx-marker='class'></div>;
      }
      return (
        <div {...props} className={classNames(props.className || 'no-class', 'blank-iterator')}>
          <BlankIterator agent={agent}>{children}</BlankIterator>
        </div>
      );
    }
    if (c.type === 'a' && c.props.href === '/map') {
      return React.cloneElement(c, {
        href: `/${agent.agent_id}/${agent.metatags.profile_slug}${c.props.href}`,
      });
    }
    return c;
  });
  return <>{Wrapped}</>;
}

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
            const local: string[] = getData(Events.LovedItem) || [];
            const existing: { property: PropertyDataModel; id: number; notes: string }[] = data.records || [];
            if (local.length) {
              const mls_ids: string[] = [];
              local.forEach(mls_id => {
                if (!mls_ids.includes(mls_id)) mls_ids.push(mls_id);
              });
              Promise.all(
                mls_ids.map(async (mls_id, idx: number) => {
                  if (existing?.filter((listing: { property: PropertyDataModel }) => mls_id === listing.property.mls_id).length === 0) {
                    return loveHome(mls_id, agent.id);
                  }
                }),
              ).then((new_records: { record?: { id: number; notes: string; property: PropertyDataModel } }[]) => {
                new_records.forEach(rec => {
                  if (rec && rec.record) {
                    existing.push(rec.record);
                  }
                });
              });
            }

            const loved_properties = existing.map(p => {
              return {
                ...p.property,
                love: p.id,
                notes: p.notes,
                cover_photo: p.property.photos?.[0] ? getImageSized(p.property.photos[0]) : '/house-placeholder.png',
              };
            });

            console.log({ loved_properties });

            lovers.fireEvent({
              properties: loved_properties,
            } as unknown as EventsData);
            selectPropertyEvt.fireEvent(loved_properties[0] as unknown as EventsData);
          });
        })
        .catch(() => {
          router.push('/log-out');
        });
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  return (
    <ClientDashboardIterator
      id='SavedHome'
      className={'RxCustomerView-ClientDashboardIterator rexified'}
      onCancel={() => {
        console.log('canceled');
      }}
      onConfirm={console.log}
      onClickChangeCompareStats={() => {
        document.getElementById('customer-view-modal-compare-filters')?.classList.add('is-really-visible');
      }}
      reload={console.log}
      property={property}
      properties={properties}
      agent={agent}
      active-tab={active_tab}
    >
      {children}
    </ClientDashboardIterator>
  );
}
