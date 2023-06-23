'use client';
import { CustomerRecord } from '@/_typings/customer';
import useEvent, { Events } from '@/hooks/useEvent';
import { useSearchParams } from 'next/navigation';
import React from 'react';

type Props = {
  children: React.ReactElement;
  className: string;
};

function Iterator(p: { children: React.ReactElement; customer?: CustomerRecord }) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.['data-field']) {
      let values: { [key: string]: string } = {};
      if (p.customer) values = p.customer as unknown as { [key: string]: string };
      return React.cloneElement(child, {
        children: values[child.props['data-field']] || '',
      });
    } else if (child.type === 'div') {
      return (
        <div {...child.props}>
          <Iterator {...p}>{child.props.children}</Iterator>
        </div>
      );
    }
    return child;
  });

  return <>{Wrapped}</>;
}

export default function CRMNav(p: Props) {
  const session = useEvent(Events.LoadUserSession);
  const { customers } = session.data as unknown as {
    customers: CustomerRecord[];
  };
  const [customer, setCustomer] = React.useState<CustomerRecord>();

  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (customers && customers.length && !customer) {
      const [record] = customers.filter(c => c.id === Number(searchParams.get('customer')));
      if (record) setCustomer(record);
    }
  }, [customers, customer, searchParams]);

  return (
    <nav className={p.className}>
      <Iterator {...p} customer={customer}>
        {p.children}
      </Iterator>
    </nav>
  );
}
