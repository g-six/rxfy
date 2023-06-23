'use client';
import { CustomerRecord } from '@/_typings/customer';
import { PropertyDataModel } from '@/_typings/property';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import RxPropertyCard from '@/components/RxCards/RxPropertyCard';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { useSearchParams } from 'next/navigation';
import React from 'react';

type Props = {
  children: React.ReactElement;
  className: string;
};

interface LovedProperty extends PropertyDataModel {
  love: number;
}

function Iterator(p: { children: React.ReactElement; agent: number; properties: LovedProperty[]; onSelectProperty: (property: LovedProperty) => void }) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.className && child.props?.className.indexOf('property-card-wrapper') >= 0) {
      return (
        <>
          {p.properties ? (
            p.properties.map((property: LovedProperty) => {
              const listing = {
                ...property,
                cover_photo: property.property_photo_album?.data?.attributes.photos.length
                  ? getImageSized(property.property_photo_album?.data?.attributes.photos[0], 300)
                  : '',
              };
              return (
                <RxPropertyCard
                  key={property.id}
                  love={property.love}
                  agent={p.agent}
                  listing={listing}
                  isLink={false}
                  onClick={() => {
                    p.onSelectProperty(property);
                  }}
                  view-only
                >
                  {child.props.children}
                </RxPropertyCard>
              );
            })
          ) : (
            <></>
          )}
        </>
      );
    } else if (child.type === 'div' && typeof child.props.children !== 'string') {
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

export default function CustomerProperties(p: Props) {
  const session = useEvent(Events.LoadUserSession);
  const selectPropertyEvt = useEvent(Events.SelectCustomerLovedProperty);
  const { agent, customers } = session.data as unknown as {
    agent: number;
    customers: CustomerRecord[];
  };
  const [customer, setCustomer] = React.useState<CustomerRecord>();
  const [properties, setProperties] = React.useState<LovedProperty[]>([]);

  const searchParams = useSearchParams();

  const onSelectProperty = (property: LovedProperty) => {
    selectPropertyEvt.fireEvent(property as unknown as EventsData);
  };

  React.useEffect(() => {
    if (customer) {
      // Customer has been set, let's pull addtl info
      // such as their loved homes
      getLovedHomes(customer.id).then(data => {
        if (data.properties) setProperties(data.properties);
      });
    }
  }, [customer]);

  React.useEffect(() => {
    if (customers && customers.length && !customer) {
      const [record] = customers.filter(c => c.id === Number(searchParams.get('customer')));
      if (record) setCustomer(record);
    }
  }, [customers, customer, searchParams]);

  return (
    <div {...p} className={p.className}>
      <Iterator {...p} properties={properties || []} agent={agent} onSelectProperty={onSelectProperty}>
        {p.children}
      </Iterator>
    </div>
  );
}
