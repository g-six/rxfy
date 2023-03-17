'use client';
import { MLSProperty } from '@/_typings/property';
import { ReactElement, useEffect, useState } from 'react';

export default function SimilarHomes({
  className,
  properties,
  children,
}: {
  className?: string;
  properties: MLSProperty[];
  children?: ReactElement[];
}) {
  const [selected, setSelected] = useState(children);

  return (
    <div className={className}>
      Properties found: {properties.length}
      <>{selected}</>
    </div>
  );
}
