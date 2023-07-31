/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { CustomerRecord } from '@/_typings/customer';
import { LovedPropertyDataModel, PropertyDataModel } from '@/_typings/property';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import RxPropertyCard from '@/components/RxCards/RxPropertyCard';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { useSearchParams } from 'next/navigation';
import React from 'react';

type Props = {
  children: React.ReactElement;
  className: string;
  properties: LovedPropertyDataModel[];
};

function Iterator(p: {
  children: React.ReactElement;
  agent: number;
  properties: LovedPropertyDataModel[];
  onSelectProperty: (property: LovedPropertyDataModel) => void;
}) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.className && child.props?.className.indexOf('property-card-wrapper') >= 0) {
      return (
        <>
          {p.properties ? (
            p.properties.map((property: LovedPropertyDataModel) => {
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
  const searchParams = useSearchParams();
  const session = useEvent(Events.LoadUserSession);
  const selectPropertyEvt = useEvent(Events.SelectCustomerLovedProperty);
  const addPropertyToCompareEvt = useEvent(Events.AddPropertyToCompare);
  const lovers = useEvent(Events.LoadLovers);
  const { agent } = session.data as unknown as {
    agent: number;
    customers: CustomerRecord[];
  };

  const [properties, setProperties] = React.useState<LovedPropertyDataModel[]>([]);

  const onSelectProperty = (property: LovedPropertyDataModel) => {
    selectPropertyEvt.fireEvent(property as unknown as EventsData);
    const { properties } = addPropertyToCompareEvt.data as unknown as {
      properties: LovedPropertyDataModel[];
    };
    addPropertyToCompareEvt.fireEvent({
      properties:
        properties && properties.filter(included => included.id === property.id).length === 0 ? properties.concat([property]) : properties || [property],
    } as unknown as EventsData);
  };

  React.useEffect(() => {
    if (p.properties && p.properties.length) {
      setProperties(p.properties);
    } else {
      const customer_id = searchParams.get('customer') as unknown as number;
      getLovedHomes(customer_id).then(data => {
        if (data.records) {
          setProperties(data.records);
          lovers.fireEvent(data as unknown as EventsData);
          let default_property = false;
          data.records.forEach((property: LovedPropertyDataModel) => {
            if (!default_property) {
              default_property = true;
              onSelectProperty(
                property.cover_photo
                  ? property
                  : {
                      ...property,
                      cover_photo: '/house-placeholder.png',
                    },
              );
            }
          });
        }
      });
    }
  }, []);

  return (
    <div className={p.className}>
      <Iterator {...p} properties={properties || []} agent={agent} onSelectProperty={onSelectProperty}>
        {p.children}
      </Iterator>
    </div>
  );
}
