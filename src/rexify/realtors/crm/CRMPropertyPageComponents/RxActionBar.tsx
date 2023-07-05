import { PropertyDataModel } from '@/_typings/property';
import { unloveHome, unloveHomeForCustomer } from '@/_utilities/api-calls/call-love-home';
import { classNames } from '@/_utilities/html-helper';
import { formatAddress } from '@/_utilities/string-helper';
import { useSearchParams } from 'next/navigation';
import React from 'react';

interface Props {
  children: React.ReactElement;
  className: string;
  property: PropertyDataModel & { love: number };
  unlove: () => void;
}

function replacePlaceholders(placeholder: string, property: PropertyDataModel) {
  switch (placeholder) {
    case '{Price}':
      return placeholder.split(placeholder).join('$' + new Intl.NumberFormat().format(property.asking_price));
    case '{Address}':
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
      return React.cloneElement(
        <button type='button'>
          <Iterator {...p}>{child.props.children}</Iterator>
        </button>,
        {
          ...child.props,
          className: child.props.className,
          onClick: () => {
            if (child.props.className.indexOf('action-heart') >= 0) {
              p.unlove();
            }
          },
        },
      );
    }

    return child;
  });

  return <>{Wrapped}</>;
}

export default function RxActionBar(p: Props) {
  const searchParams = useSearchParams();
  const unlove = () => {
    let customer_id = 0;
    if (searchParams.get('customer')) customer_id = Number(searchParams.get('customer'));
    if (customer_id) unloveHomeForCustomer(p.property.love, customer_id).then(console.log).catch(console.error);
  };
  return p.property ? (
    <Iterator {...p} unlove={unlove}>
      {p.children}
    </Iterator>
  ) : (
    <></>
  );
}
