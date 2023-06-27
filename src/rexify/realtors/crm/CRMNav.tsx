'use client';
import { CustomerRecord } from '@/_typings/customer';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { useSearchParams } from 'next/navigation';
import React from 'react';

type Props = {
  children: React.ReactElement;
  className: string;
  customer?: CustomerRecord;
};

function NormalizedLinkElement(p: { children: React.ReactElement; customer?: CustomerRecord; 'customer-id': number }) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.type === 'div') {
      return (
        <span className={child.props.className || ''}>
          <NormalizedLinkElement {...p}>{child.props.children}</NormalizedLinkElement>
        </span>
      );
    }
    return child;
  });
  return (
    <Iterator {...p}>
      <>{Wrapped}</>
    </Iterator>
  );
}

function Iterator(p: { children: React.ReactElement; customer?: CustomerRecord; 'customer-id': number }) {
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
    } else if (child.type === 'a' && p.customer) {
      return React.cloneElement(child, {
        ...child.props,
        href: `${child.props.href}?customer=${p['customer-id']}`,
        children: <NormalizedLinkElement {...p}>{child.props.children}</NormalizedLinkElement>,
      });
    }
    return child;
  });

  return <>{Wrapped}</>;
}

export default function CRMNav(p: Props) {
  const search = useSearchParams();
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
        <Iterator {...p} customer={customer} customer-id={search.get('customer') ? Number(search.get('customer')) : 0}>
          {p.children}
        </Iterator>
      ) : (
        p.children
      )}
    </nav>
  );
}
