import { consoler } from '@/_helpers/consoler';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { LovedPropertyDataModel, PropertyDataModel } from '@/_typings/property';
import { unloveHome, unloveHomeForCustomer } from '@/_utilities/api-calls/call-love-home';
import { classNames } from '@/_utilities/html-helper';
import { formatAddress } from '@/_utilities/string-helper';
import useEvent, { Events, EventsData, NotificationCategory } from '@/hooks/useEvent';
import { useSearchParams } from 'next/navigation';
import React from 'react';

interface Props {
  children: React.ReactElement;
  className: string;
  property: PropertyDataModel & { love: number };
  unlove: () => void;
  reload: (r: unknown) => void;
  agent?: string;
  slug?: string;
}

function replacePlaceholders(placeholder: string, property: PropertyDataModel) {
  switch (placeholder) {
    case '{Price}':
    case 'Price':
      return placeholder.split(placeholder).join('$' + new Intl.NumberFormat().format(property.asking_price));
    case '{Address}':
    case 'Address':
      return placeholder
        .split(placeholder)
        .join(formatAddress(property.title || '') + ['', property.city, [property.state_province, property.postal_zip_code].join(' ')].join(', '));
  }
  return placeholder;
}

function Iterator(p: Props) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.type === 'div') {
      return (
        <div className={classNames(child.props.className || '', 'rexified')}>
          {typeof child.props.children === 'string' ? (
            replacePlaceholders(child.props.children, p.property)
          ) : (
            <Iterator {...p}>{child.props.children}</Iterator>
          )}
        </div>
      );
    } else if (child.type === 'a') {
      if (p.agent)
        return React.cloneElement(
          <button type='button'>
            <Iterator {...p}>{child.props.children}</Iterator>
          </button>,
          {
            ...child.props,
            href: undefined,
            className: child.props.className,
            children: React.Children.map(child.props.children, convertDivsToSpans),
            onClick: (evt: React.SyntheticEvent<HTMLButtonElement>) => {
              if (child.props.className.indexOf('action-heart') >= 0) {
                p.unlove();
              } else if (evt.currentTarget.textContent === 'Compare') {
              } else if (child.props.className.includes('pdf')) {
                window.open(`/api/pdf/mls/${p.property && p.property.mls_id}?agent=${p.agent}&slug=${p.slug}/brochure?mls=${p.property && p.property.mls_id}`);
              }
            },
          },
        );
      return <></>;
    }

    return child;
  });

  return <>{Wrapped}</>;
}
const FILE = 'CRMPropertyPageComponents/RxActionBar.tsx';
export default function RxActionBar(p: Props) {
  const { data, fireEvent } = useEvent(Events.AddPropertyToCompare);
  const searchParams = useSearchParams();
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const { data: confirmation, fireEvent: confirmUnlove } = useEvent(Events.GenericEvent);
  const { id: to_unlove, confirmed_action } = confirmation as unknown as {
    confirmed_action: string;
    id: number;
  };

  const unlove = () => {
    confirmUnlove({
      confirm_unlove: true,
      id: Number,
    } as unknown as EventsData);
  };

  if (confirmed_action === 'unlove') {
    let customer_id = 0;
    if (searchParams.get('customer')) customer_id = Number(searchParams.get('customer'));

    if (customer_id && to_unlove) {
      confirmUnlove({});
      unloveHomeForCustomer(to_unlove, customer_id).then(p.reload).catch(console.error);
      const { properties } = data as unknown as {
        properties: LovedPropertyDataModel[];
      };
      fireEvent({
        properties:
          properties && properties.filter(included => included.love !== p.property.love) ? properties.concat([p.property]) : properties || [p.property],
      } as unknown as EventsData);
      notify({
        timeout: 5000,
        category: NotificationCategory.SUCCESS,
        message: 'Property was successfully removed.',
      });
      setTimeout(() => location.reload(), 5500);
    }
  }

  return p.property ? (
    <Iterator {...p} unlove={unlove}>
      {p.children}
    </Iterator>
  ) : (
    <></>
  );
}
