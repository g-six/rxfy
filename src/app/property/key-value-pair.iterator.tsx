'use client';
import { Children, ReactElement, cloneElement } from 'react';

export default function KeyValueIterator({ children, ...props }: { children: ReactElement; label: string; value: string; className: string }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.['data-field']) {
      if (c.props?.['data-field'].indexOf('_name') > 0) return cloneElement(c, {}, props.label);
      if (c.props?.['data-field'].indexOf('_result') > 0) return cloneElement(c, {}, props.value);
    } else if (c.props?.children && typeof c.props.children !== 'string') {
      return cloneElement(c, {}, <KeyValueIterator {...props}>{c.props.children}</KeyValueIterator>);
    }
    return c;
  });

  return (
    <div className={props.className} rx-component='property.key-value-pair.iterator' rx-labelled-as={props.label} suppressHydrationWarning>
      {Rexified}
    </div>
  );
}
