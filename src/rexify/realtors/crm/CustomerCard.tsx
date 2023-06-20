import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import React from 'react';

type Props = {
  children: React.ReactElement;
  className?: string;
  'data-id': number;
  'data-full-name': string;
  'data-city': string;
  'data-dwelling-type': string;
  'data-minprice': number;
  'data-maxprice': number;
};

function Iterator(p: Props) {
  const Wrapped = React.Children.map(p.children, (child, idx) => {
    if (child.props?.children) {
      if (child.props?.className) {
        if (child.props.className.indexOf('crm-name') >= 0)
          return (
            <div key='crm-name' className={`rexified ${child.props.className}`}>
              {p['data-full-name']}
            </div>
          );
        if (child.props.className.indexOf('crm-address') >= 0)
          return (
            <div key='crm-address' className={`rexified ${child.props.className}`}>
              {p['data-city'] ? p['data-city'] : ''} {p['data-dwelling-type'] ? p['data-dwelling-type'] : ''}
            </div>
          );
        if (child.props.className.indexOf('crm-price') >= 0)
          return (
            <div key='crm-price' className={`rexified ${child.props.className}`}>
              {p['data-minprice'] ? getShortPrice(p['data-minprice']) : ''} - {p['data-maxprice'] ? getShortPrice(p['data-maxprice']) : ''}
            </div>
          );
        if (child.props.className.indexOf('f-team-detail') >= 0) {
          return (
            <div {...child.props} key={child.props.className}>
              <Iterator {...p}>{child.props.children}</Iterator>
            </div>
          );
        }
      }
    }
    return React.cloneElement(child, {
      key: idx,
    });
  });
  return <>{Wrapped}</>;
}

export default function RxCRMCustomerCard(p: Props) {
  const evt = useEvent(Events.SelectCustomerCard);
  const { active } = evt.data as unknown as {
    active: number;
  };
  return (
    <div
      className={['RxCRMCustomerCard', p.className || '', active === p['data-id'] && 'active'].join(' ').trim()}
      onClick={() => {
        evt.fireEvent({
          active: p['data-id'],
        } as unknown as EventsData);
      }}
    >
      <Iterator {...p}>{p.children}</Iterator>
    </div>
  );
}
