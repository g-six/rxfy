'use client';
import React from 'react';
import CustomerProperties from './crm/CustomerProperties';
import { LovedPropertyDataModel } from '@/_typings/property';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { AgentData } from '@/_typings/agent';
import RxCustomerPropertyView from './crm/CustomerPropertyView';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import CRMNav from '@/rexify/realtors/crm/CRMNav';
import RxSavedHomesNav from './crm/RxSavedHomesNav';
import RxMapView from './crm/RxMapView';
import RxMapPropertyModal from './crm/CRMMapComponents/RxMapPropertyModal';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { useSearchParams } from 'next/navigation';
import { setData } from '@/_utilities/data-helpers/local-storage-helper';
import { CustomerRecord } from '@/_typings/customer';
import { RxCustomerCompareCanvas } from './crm/CustomerCompareCanvas';
import RxCompareFiltersModal from './crm/RxCompareFiltersModal';
import RxCustomerSavedSearch from './crm/RxCustomerSavedSearch';
import MyHomeAlertsList from '@/_replacers/MyHomeAlerts/MyHomeAlertsList';

type Props = {
  children: React.ReactElement;
  id?: string;
  agent?: AgentData;
  className?: string;
};

function Iterator(
  p: Props & { property?: LovedPropertyDataModel; properties?: LovedPropertyDataModel[]; 'active-tab'?: string; onClickChangeCompareStats?(): void },
) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.children || child.props?.className) {
      if (child.type === 'div') {
        if (child.props?.id === 'customer-view-modal-compare-filters') {
          return (
            <RxCompareFiltersModal {...child.props} filters={p.property ? Object.keys(p.property) : []}>
              {child.props.children}
            </RxCompareFiltersModal>
          );
        }
        if (child.props.className === 'properties-column') {
          return (
            <CustomerProperties {...child.props} properties={p.properties} property={p.property}>
              {child.props.children}
            </CustomerProperties>
          );
        } else if (p.agent && child.props.className?.split(' ').includes(WEBFLOW_NODE_SELECTOR.CRM_COMPARE_WRAPPER)) {
          return <RxCustomerCompareCanvas className={child.props.className}>{child.props.children}</RxCustomerCompareCanvas>;
        } else if (p.agent && child.props.className?.split(' ').includes(WEBFLOW_NODE_SELECTOR.CRM_PROPERTY_PREVIEW)) {
          return <RxCustomerPropertyView className={child.props.className}>{child.props.children}</RxCustomerPropertyView>;
        } else if (child.props.className?.split(' ').includes('indiv-map-tabs')) {
          return <RxSavedHomesNav {...child.props}>{child.props.children}</RxSavedHomesNav>;
        } else if (child.props.className?.split(' ').includes(WEBFLOW_NODE_SELECTOR.CRM_MAP)) {
          return <RxMapView />;
        } else if (p.agent && child.props.className?.split(' ').includes('map-property-modal')) {
          return <RxMapPropertyModal {...child.props}>{child}</RxMapPropertyModal>;
        } else if (p.agent && child.props.className?.split(' ').includes('all-home-alerts')) {
          return <MyHomeAlertsList child={child} agent_data={p.agent} />;
        } else if (p.agent && child.props.className === WEBFLOW_NODE_SELECTOR.CRM_NAV_WRAPPER) {
          return <CRMNav className={child.props.className}>{child}</CRMNav>;
        } else if (child.props?.['data-w-tab']) {
          return React.cloneElement(child, {
            ...child.props,
            children: <Iterator {...p}>{child.props.children}</Iterator>,
            className:
              child.props.className.split('w--tab-active').join('') +
              ' rexified' +
              ' ' +
              (p['active-tab'] === child.props['data-w-tab'] ? 'w--tab-active' : ''),
          });
        }
        return (
          <div {...child.props}>
            <Iterator {...p}>{child.props.children}</Iterator>
          </div>
        );
      } else if (child.type === 'form') {
        return (
          <div {...child.props}>
            <Iterator {...p}>{child.props.children}</Iterator>
          </div>
        );
      } else if (child.props?.rx === 'filters-btn-trigger') {
        return React.cloneElement(<button type='button' />, {
          ...child.props,
          children: React.cloneElement(<span />, {
            ...child.props.children.props,
          }),
          onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
            switch (evt.currentTarget.textContent?.toLowerCase()) {
              case 'change compare stats':
                p.onClickChangeCompareStats && p.onClickChangeCompareStats();
            }
          },
        });
      }
    }
    return child;
  });

  return <>{Wrapped}</>;
}

export default function RxCustomerView(p: Props) {
  const [hydrated, setHydrated] = React.useState(false);
  const searchParams = useSearchParams();
  const session = useEvent(Events.LoadUserSession);
  const lovers = useEvent(Events.LoadLovers);
  const selectPropertyEvt = useEvent(Events.SelectCustomerLovedProperty);
  const [properties, setProperties] = React.useState<LovedPropertyDataModel[]>([]);
  const [property, selectProperty] = React.useState<LovedPropertyDataModel>();
  const [agent, setAgent] = React.useState<AgentData>(session.data as unknown as AgentData);
  const [active_tab, setSelectedTab] = React.useState<string>('Tab 1');
  const onSelectProperty = (property: LovedPropertyDataModel) => {
    selectPropertyEvt.fireEvent(property as unknown as EventsData);
  };

  React.useEffect(() => {
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
    const { id, customers, ...selections } = session.data as unknown as AgentData;
    const tabs = selections as unknown as {
      [key: string]: string;
    };
    if (tabs['active-crm-saved-homes-view']) setSelectedTab(tabs['active-crm-saved-homes-view']);
    if (id) {
      setAgent(session.data as unknown as AgentData);
      const customer_id = searchParams.get('customer') as unknown as number;

      if (customer_id) {
        if (customers && customers.length) {
          const [record] = customers.filter((c: CustomerRecord) => {
            console.log(c.id, Number(searchParams.get('customer')));
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
              }),
            );
          }
        }
        getLovedHomes(customer_id).then(data => {
          if (data.properties) {
            setProperties(data.properties);
            lovers.fireEvent(data as unknown as EventsData);
            let default_property = false;
            data.properties.forEach((property: LovedPropertyDataModel) => {
              if (property.cover_photo && !default_property) {
                default_property = true;
                onSelectProperty(property);
              }
            });
          }
        });
      }
    }
    setHydrated(true);
  }, []);

  return (
    <div {...p}>
      {hydrated ? (
        <Iterator
          {...p}
          property={property}
          agent={agent}
          properties={properties}
          active-tab={active_tab}
          onClickChangeCompareStats={() => {
            document.getElementById('customer-view-modal-compare-filters')?.classList.add('is-really-visible');
          }}
        >
          {p.children}
        </Iterator>
      ) : (
        p.children
      )}
    </div>
  );
}
