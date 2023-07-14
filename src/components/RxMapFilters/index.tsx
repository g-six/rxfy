'use client';
import { queryStringToObject } from '@/_utilities/url-helper';
import { useSearchParams } from 'next/navigation';
import React from 'react';

function Iterator({
  children,
  ...props
}: {
  children: React.ReactElement;
  'agent-id'?: string;
  'agent-record-id'?: number;
  'profile-slug'?: string;
  'agent-metatag-id'?: number;
}) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      const { children: subchildren, ...subprops } = c.props;
      return (
        <div {...subprops}>
          <Iterator {...props}>{subchildren}</Iterator>
        </div>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default function RxMapFilters({ children, ...values }: { [key: string]: string } & { children: React.ReactElement }) {
  const q = useSearchParams();
  const filters = queryStringToObject(q.toString());
  console.log({ filters });
  return <Iterator {...values}>{children}</Iterator>;
}
