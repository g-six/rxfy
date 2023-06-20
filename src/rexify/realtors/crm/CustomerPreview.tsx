'use client';
import React from 'react';
import useEvent, { Events } from '@/hooks/useEvent';
import { CustomerRecord } from '@/_typings/customer';

type Props = {
  children: React.ReactElement;
  className?: string;
  'data-customer': CustomerRecord;
};

function Iterator(p: Props) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.children) {
      if (child.props?.['data-field']) {
        switch (child.props['data-field']) {
          case 'full_name':
            console.log(p['data-customer']);
            return React.cloneElement(child, {
              children: (p['data-customer'] && p['data-customer'].full_name) || 'No Name',
            });
          default:
            return child;
        }
      } else if (child.type !== 'div') {
        return child;
      }
      return (
        <div {...child.props}>
          <Iterator {...child.props} data-customer={p['data-customer']}>
            {child.props.children}
          </Iterator>
        </div>
      );
    } else {
      return child;
    }
  });
  return <>{Wrapped}</>;
}

export default function RxCRMCustomerPreview(p: Props) {
  const evt = useEvent(Events.SelectCustomerCard);
  const { active } = evt.data as unknown as {
    active: number;
  };

  const { data } = useEvent(Events.LoadUserSession);
  const { customers } = data as unknown as {
    customers: CustomerRecord[];
  };
  const [customer] = active ? customers?.filter(customer => customer.id === active) : [];

  return (
    <section className={['RxCRMCustomerPreview', p.className || ''].join(' ').trim()}>
      <Iterator data-customer={customer}>{p.children}</Iterator>
    </section>
  );
}
