'use client';
import SearchAddressCombobox from '@/_replacers/FilterFields/SearchAddressCombobox';
import { objectToQueryString } from '@/_utilities/url-helper';
import React from 'react';

type Props = {
  children: React.ReactElement;
  className?: string;
};

const onPlaceSelected = (p: { [key: string]: string }) => {
  const qry = objectToQueryString(p);
  const u = new URL(location.href);
  if (u.pathname.split('/').length > 2) {
    location.href = `${location.href}/map?${qry}`;
  } else {
    location.href = `/map?${qry}`;
  }
};

function Iterator(p: Props & { id?: string; 'data-session': unknown; onClick: React.MouseEventHandler }) {
  const collection = React.Children.map(p.children, child => {
    if (!child.props) {
      return child;
    } else if (typeof child.props.children === 'string') {
      return React.cloneElement(child, {
        className: `${child?.props?.className || ''} rexified`.trim(),
      });
    } else if (child.type === 'input') {
      return <SearchAddressCombobox {...child.props} onPlaceSelected={onPlaceSelected} />;
    } else if (child.type && !['div', 'form'].includes(child.type as string)) {
      return child;
    }
    return (
      <Iterator {...child.props} data-session={p['data-session']} onClick={p.onClick}>
        {child.props.children}
      </Iterator>
    );
  });

  return (
    <div className={p.className} id={p.id} onClick={p.onClick}>
      {collection}
    </div>
  );
}

export default function RxSearchPlaceForm({ children, className }: { className?: string; children: React.ReactElement | React.ReactElement[] }) {
  return (
    <div className={`rexified ${className || ''}`.trim()}>
      {React.Children.map(children, child => {
        return <Iterator {...child.props}>{child}</Iterator>;
      })}
    </div>
  );
}
