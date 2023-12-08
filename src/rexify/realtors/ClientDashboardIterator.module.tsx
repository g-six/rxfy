'use client';
import React, { cloneElement } from 'react';
import { LovedPropertyDataModel } from '@/_typings/property';
import RxCompareFiltersModal from './crm/RxCompareFiltersModal';
import CustomerProperties from './crm/CustomerProperties';
import { RxCustomerCompareCanvas } from './crm/CustomerCompareCanvas';
import RxCustomerPropertyView from './crm/CustomerPropertyView';
import RxSavedHomesNav from './crm/RxSavedHomesNav';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import RxMapView from './crm/RxMapView';
import RxMapPropertyModal from './crm/CRMMapComponents/RxMapPropertyModal';
import RxMyHomeAlerts from '@/components/full-pages/RxMyHomeAlerts';
import DocumentsReplacer from '@/_replacers/Documents/documents';
import RxCustomerAccountView from './crm/RxCustomerAccountView';
import CRMNav from './crm/CRMNav';
import { AgentData } from '@/_typings/agent';
import { getAgentBaseUrl } from '@/app/api/_helpers/agent-helper';
import useEvent, { Events } from '@/hooks/useEvent';
import styles from '@/rexify/dynamic-styles.module.scss';
import { RxEmptyState } from '@/components/RxCards/RxEmptyState.iterator';
import MoreFieldsPopup from '@/app/my-listings/private-listing-workspace/components/more-fields.popup';
import { consoler } from '@/_helpers/consoler';

type Props = {
  children: React.ReactElement;
  id?: string;
  agent?: AgentData;
  className?: string;
};

function TransformLink({ children }: { children: React.ReactElement }) {
  const { data } = useEvent(Events.LoadUserSession);
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      const { children: sub, ...props } = c.props;
      return (
        <div {...props}>
          <TransformLink base-url={props['base-url']}>{sub}</TransformLink>
        </div>
      );
    }
    if (c.type === 'a') {
      const { href, children: sub, ...props } = c.props;
      return (
        <a {...props} href={getAgentBaseUrl(data as unknown as AgentData) + href}>
          {sub}
        </a>
      );
    }
    return c;
  });

  return <>{Wrapped}</>;
}

export function ConfirmDeleteIterator({ children, onCancel, onConfirm }: { children: React.ReactElement; onConfirm: () => void; onCancel: () => void }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      return (
        <div className={c.props.className}>
          <ConfirmDeleteIterator onCancel={onCancel} onConfirm={onConfirm}>
            {c.props.children}
          </ConfirmDeleteIterator>
        </div>
      );
    }
    if (c.type === 'a') {
      if (`${c.props.children}` === 'Cancel') {
        return React.cloneElement(c, {
          ...c.props,
          onClick: onCancel,
        });
      }
      if (`${c.props.children}` === 'Remove Saved Home') {
        return React.cloneElement(c, {
          ...c.props,
          onClick: onConfirm,
        });
      }
    }
    return c;
  });

  return <>{Wrapped}</>;
}
const FILE = 'realtors/ClientDashboardIterator.module.tsx';
export default function ClientDashboardIterator(
  p: Props & {
    property?: LovedPropertyDataModel;
    properties?: LovedPropertyDataModel[];
    'active-tab'?: string;
    onClickChangeCompareStats?(): void;
    onCancel(): void;
    onConfirm(): void;
    reload: () => void;
    confirm?: boolean;
  },
) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.children || child.props?.className) {
      let { className, 'data-component': component_name, ...attribs } = child.props;
      const classes: string[] = `${className || ''}`.split(' ');
      if (p.property?.id || (p.properties && p.properties.length)) {
        if (classes.includes('initially-hidden')) {
          className = classes.filter(name => !['opacity-0', 'hidden'].includes(name)).join(' ');
        }
      } else {
        // Empty States empty-state
        if (classes.includes('initially-hidden') && child.props['data-field'] === 'empty_state') {
          className = classes
            .filter(name => name !== 'opacity-0' && name !== 'hidden')
            .concat(styles.shown)
            .join(' ');
        }
        if (component_name === 'property_card_small') {
          return cloneElement(child, {
            style: {
              opacity: '0',
            },
          });
        }
      }
      if (className?.includes('confirm-delete')) {
        return React.cloneElement(child, {
          ...child.props,
          className: p.confirm ? 'flex items-center align-center justify-center absolute w-full h-full' : className,
          children: (
            <ConfirmDeleteIterator onCancel={p.onCancel} onConfirm={p.onConfirm}>
              {child.props.children}
            </ConfirmDeleteIterator>
          ),
        });
      } else if (child.type === 'div') {
        if (child.props?.id === 'customer-view-modal-compare-filters') {
          return (
            <RxCompareFiltersModal {...child.props} filters={p.property ? Object.keys(p.property) : []}>
              {child.props.children}
            </RxCompareFiltersModal>
          );
        }
        if (child.props?.['data-panel'] === 'properties_column') {
          return p.properties !== undefined && p.properties.length ? (
            <CustomerProperties {...child.props} properties={p.properties} property={p.property}>
              {child.props.children}
            </CustomerProperties>
          ) : (
            <div className='block w-72' />
          );
        } else if (p.agent && className?.split(' ').includes(WEBFLOW_NODE_SELECTOR.CRM_COMPARE_WRAPPER)) {
          return (
            <RxCustomerCompareCanvas properties={p.properties ? p.properties.slice(0, 3) : undefined} className={className}>
              {child.props.children}
            </RxCustomerCompareCanvas>
          );
        } else if (p.agent && (className?.split(' ').includes(WEBFLOW_NODE_SELECTOR.CRM_PROPERTY_PREVIEW) || child.props?.['data-panel'] === 'individual')) {
          return (
            <RxCustomerPropertyView agent={p.agent} reload={p.reload} property={p.property} className={className}>
              {child.props.children}
            </RxCustomerPropertyView>
          );
        } else if (child.props['data-field'] === 'empty_state') {
          // Hide empty state elements on presence of property or properties
          // if (!p.property?.id || p.properties?.length === 0) {
          //   return cloneElement(child, { className });
          // }

          if (p.agent?.agent_id)
            return (
              <TransformLink>
                <RxEmptyState
                  className={p.className}
                  agent={p.agent}
                  data={{
                    property: p.property,
                    properties: p.properties,
                  }}
                >
                  {child}
                </RxEmptyState>
              </TransformLink>
            );
        } else if (className?.split(' ').includes('indiv-map-tabs')) {
          return (
            <RxSavedHomesNav {...child.props} active-tab={p['active-tab']}>
              {child.props.children}
            </RxSavedHomesNav>
          );
        } else if (className?.split(' ').includes(WEBFLOW_NODE_SELECTOR.CRM_MAP)) {
          return (
            <RxMapView {...child.props} className='' lat={p.property?.lat} lng={p.property?.lon} properties={p.properties}>
              {child.props.children}
            </RxMapView>
          );
        } else if (p.agent && className?.split(' ').includes('map-property-modal')) {
          return <RxMapPropertyModal {...child.props}>{child}</RxMapPropertyModal>;
        } else if (p.agent && className?.split(' ').includes(WEBFLOW_NODE_SELECTOR.MY_HOME_ALERTS)) {
          return <RxMyHomeAlerts {...child.props} agent-data={p.agent} child={child} />;
        } else if (p.agent && className?.split(' ').includes(WEBFLOW_NODE_SELECTOR.DOCUMENTS)) {
          return <DocumentsReplacer nodeProps={child.props} agent_data={p.agent} nodes={child.props.children} />;
        } else if (p.agent && className?.split(' ').includes(WEBFLOW_NODE_SELECTOR.CRM_ACCOUNT_FORM)) {
          return (
            <RxCustomerAccountView agent-data={p.agent} {...child.props}>
              {child.props.children}
            </RxCustomerAccountView>
          );
        } else if (p.agent && className === WEBFLOW_NODE_SELECTOR.CRM_NAV_WRAPPER) {
          return <CRMNav className={className}>{child}</CRMNav>;
        } else if (child.props?.['data-w-tab']) {
          return React.cloneElement(child, {
            ...child.props,
            children: <ClientDashboardIterator {...p}>{child.props.children}</ClientDashboardIterator>,
            className: className.split('w--tab-active').join('') + ' rexified' + ' ' + (p['active-tab'] === child.props['data-w-tab'] ? 'w--tab-active' : ''),
          });
        }
        return (
          <div {...child.props}>
            <ClientDashboardIterator {...p}>{child.props.children}</ClientDashboardIterator>
          </div>
        );
      } else if (child.type === 'form') {
        return (
          <div {...child.props}>
            <ClientDashboardIterator {...p}>{child.props.children}</ClientDashboardIterator>
          </div>
        );
      } else if (child.props?.['data-action'] === 'change_compare_stats') {
        return cloneElement(
          child,
          { style: { padding: 0 } },
          <div className='w-full'>
            <MoreFieldsPopup className='bg-transparent w-full h-10 px-4' onChange={console.log} hide-icon right-align base-only>
              <>Change Compare Stats</>
            </MoreFieldsPopup>
          </div>,
        );
        // return React.cloneElement(<button type='button' />, {
        //   ...child.props,
        //   children: React.cloneElement(<span />, {
        //     ...child.props.children.props,
        //   }),
        //   onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
        //     switch (evt.currentTarget.textContent?.toLowerCase()) {
        //       case 'change compare stats':
        //         p.onClickChangeCompareStats && p.onClickChangeCompareStats();
        //     }
        //   },
        // });
      }
    }
    return child;
  });

  return <>{Wrapped}</>;
}
