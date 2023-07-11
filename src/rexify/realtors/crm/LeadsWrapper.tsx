'use client';
import React from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import RxCRMCustomerCard from './CustomerCard';
import { CustomerRecord } from '@/_typings/customer';

type Props = {
  children: React.ReactElement;
  className?: string;
  'data-status'?: 'lead' | 'active' | 'closed';
  'data-customers': CustomerRecord[];
};

function Iterator(p: Props) {
  const Wrapped = React.Children.map(p.children, (child, idx) => {
    if (child.props?.children) {
      if (child.props?.className && child.props.className.indexOf('f-team-card-outline') >= 0) {
        if (idx === 0) {
          return p['data-customers'] ? (
            <>
              {p['data-customers'].map((customer: CustomerRecord) => {
                let saved_search: {
                  city?: string;
                  dwelling_types?: string;
                  minprice?: number;
                  maxprice?: number;
                } = {};
                if (customer.saved_searches && Array.isArray(customer.saved_searches)) {
                  saved_search = {
                    ...customer.saved_searches[0],
                  };
                }
                console.log(customer);
                return (
                  <RxCRMCustomerCard
                    key={customer.id}
                    className={['rexified', child.props.className].join(' ')}
                    data-id={customer.id}
                    data-full-name={customer.full_name}
                    data-city={saved_search.city || ''}
                    data-dwelling-type={saved_search.dwelling_types || ''}
                    data-minprice={saved_search.minprice || 0}
                    data-maxprice={saved_search.maxprice || 0}
                    notes={customer.notes}
                  >
                    {child.props.children}
                  </RxCRMCustomerCard>
                );
              })}
            </>
          ) : (
            <></>
          );
        }
        return <></>;
      } else if (child.type !== 'div') {
        return child;
      }
      return <Iterator {...child.props}>{child.props.children}</Iterator>;
    } else {
      return child;
    }
  });
  return <>{Wrapped}</>;
}

export default function RxCRMLeadsWrapper(p: Props) {
  const { data } = useEvent(Events.LoadUserSession);
  const evt = useEvent(Events.SelectCustomerCard);
  const { customers } = data as unknown as {
    customers: CustomerRecord[];
  };
  const { active } = evt.data as unknown as {
    active: number;
  };
  const filtered = customers?.filter(customer => customer.status === p['data-status']);
  React.useEffect(() => {
    if (filtered?.length && p['data-status'] === 'lead' && !active) {
      evt.fireEvent({
        active: filtered[0].id,
      } as unknown as EventsData);
    }
  }, [filtered]);
  return (
    <section className={['RxCRMLeadsWrapper', p.className || ''].join(' ').trim()}>
      <Iterator data-customers={filtered}>{p.children}</Iterator>
    </section>
  );
}
