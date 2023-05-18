'use client';
import { PropertyDataModel } from '@/_typings/property';
import { getSimilarProperties } from '@/_utilities/api-calls/call-properties';
import React from 'react';
import RxPropertyCardV2 from '../RxCards/RxPropertyCardV2';

type Props = {
  className: string;
  children: React.ReactElement[];
  property: {
    [key: string]: string;
  };
};

export default function RxSimilarListings(p: Props) {
  const [loading, toggleLoading] = React.useState(true);
  const [properties, setProperties] = React.useState<(PropertyDataModel & { photos: string[] })[]>([]);
  React.useEffect(() => {
    getSimilarProperties(p.property).then(d => {
      setProperties(d);
      toggleLoading(false);
    });
  }, []);
  return loading ? (
    <div className={[p.className, loading ? 'hidden' : ''].join(' ')}>{p.children}</div>
  ) : (
    <div className={[p.className, loading ? 'hidden' : ''].join(' ')}>
      {properties && properties.length ? (
        p.children.map((child, num) => (
          <RxPropertyCardV2 key={`card-${num + 1}`} listing={properties[num]}>
            {child}
          </RxPropertyCardV2>
        ))
      ) : (
        <></>
      )}
    </div>
  );
}
