'use client';

import { ReactElement } from 'react';

export default function PropertyCard({
  children,
  className,
  data,
}: {
  children: ReactElement[];
  className: string;
  data: Record<string, string>;
}) {
  return (
    <div
      className={className}
      onClick={() => {
        location.href = `/property?mls=${data.mls}`;
      }}
    >
      {children}
    </div>
  );
}
