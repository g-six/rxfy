'use client';
import { CustomerRecord } from '@/_typings/customer';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import useEvent, { Events } from '@/hooks/useEvent';
import { useSearchParams } from 'next/navigation';
import React from 'react';

type Props = {
  children: React.ReactElement;
  className: string;
  customer?: CustomerRecord;
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
  const [hydrated, setHydrated] = React.useState(false);
  const [customer, setCustomer] = React.useState<CustomerRecord>();

  React.useEffect(() => {
    const local = getData('viewing_customer') as unknown as CustomerRecord;
    setCustomer(local);
    setHydrated(true);
  }, []);

  return (
    <nav className={p.className}>
      {hydrated ? (
        <Iterator {...p} customer={customer}>
          {p.children}
        </Iterator>
      ) : (
        p.children
      )}
    </nav>
  );
}
