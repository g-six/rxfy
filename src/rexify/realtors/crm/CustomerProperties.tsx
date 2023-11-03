/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { CustomerRecord } from '@/_typings/customer';
import { LovedPropertyDataModel, PropertyDataModel } from '@/_typings/property';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import RxPropertyCard from '@/components/RxCards/RxPropertyCard';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { useSearchParams } from 'next/navigation';
import React, { Children, ReactElement, cloneElement, useEffect, useState } from 'react';

type Props = {
  children: ReactElement;
  className: string;
  'data-panel'?: string;
  properties: LovedPropertyDataModel[];
};

function PropertyIterator({ children, ...p }: { children: ReactElement; property: LovedPropertyDataModel }) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(
          c,
          {
            'data-rexified': c.type,
          },
          <PropertyIterator {...p}>{c.props.children}</PropertyIterator>,
        );
      } else if (c.props['data-field']) {
        let { [c.props['data-field']]: value } = p.property as unknown as {
          [k: string]: string;
        };

        if (c.props['data-field'] === 'address')
          return cloneElement(
            c,
            {
              className: classNames(c.props.className || 'no-default-class', 'cursor-pointer', 'overflow-hidden'),
            },
            formatValues(p.property, 'title'),
          );
        if (c.props['data-field'] === 'area')
          return cloneElement(
            c,
            {
              className: classNames(c.props.className || 'no-default-class', 'cursor-pointer', 'overflow-hidden'),
            },
            formatValues(p.property, 'area'),
          );
        if (c.props['data-field'] === 'asking_price') value = `${formatValues(p.property, 'asking_price')}`;
        if (c.props['data-field'] === 'cover_photo') {
          value = '';
          if (p.property.cover_photo)
            return cloneElement(
              c,
              {
                className: classNames(c.props.className || 'no-default-class', 'cursor-pointer'),
                style: {
                  backgroundImage: `url(${p.property.cover_photo})`,
                },
              },
              value,
            );
        }
        return cloneElement(c, {}, value);
      } else if (c.props.className?.includes('image') && p.property.cover_photo) {
        return cloneElement(c, { style: { backgroundImage: `url(${p.property.cover_photo})` } });
      }
    }
    return c;
  });
  return <>{rexified}</>;
}

function Iterator(p: {
  children: ReactElement;
  agent: number;
  properties: LovedPropertyDataModel[];
  onSelectProperty: (property: LovedPropertyDataModel) => void;
}) {
  const Wrapped = Children.map(p.children, child => {
    if (child.props && child.props['data-component'] === 'property_card_small') {
      return (
        <>
          {p.properties
            ? p.properties.map((property: LovedPropertyDataModel) => {
                const listing = {
                  ...property,
                  cover_photo: property.property_photo_album?.data?.attributes.photos.length
                    ? getImageSized(property.property_photo_album?.data?.attributes.photos[0], 300)
                    : '',
                };
                let className = classNames(child.props.className || 'no-default-class', 'cursor-pointer');
                className = className.split(' opacity-0').join(' ');
                return cloneElement(
                  child,
                  {
                    key: `${property.id}-${property.love}`,
                    'data-property-id': property.id,
                    'data-love-id': property.love,
                    className,
                    onClick: () => {
                      p.onSelectProperty(property);
                    },
                  },
                  <PropertyIterator property={listing}>{child.props.children}</PropertyIterator>,
                );
              })
            : cloneElement(child, { className: classNames(child.props.className, 'opacity-0') })}
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

  const [properties, setProperties] = useState<LovedPropertyDataModel[]>([]);

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

  useEffect(() => {
    if (p.properties && p.properties.length) {
      setProperties(p.properties);
    } else {
      const customer_id = searchParams.get('customer') as unknown as number;
      getLovedHomes(customer_id).then(data => {
        if (data.records) {
          setProperties(data.records);
          lovers.fireEvent(data as unknown as EventsData);
        }
      });
    }
  }, []);

  return (
    <aside className={p.className} data-panel={p['data-panel']}>
      <Iterator {...p} properties={properties || []} agent={agent} onSelectProperty={onSelectProperty}>
        {p.children}
      </Iterator>
    </aside>
  );
}
