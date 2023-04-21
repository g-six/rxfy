import { MLSProperty } from '@/_typings/property';
import Script from 'next/script';
import React from 'react';
import { addPropertyMapScripts } from './Scripts/google-street-map';

type Props = {
  property: MLSProperty | null;
  className: string;
};

export default function RxStreetView({ property, className }: Props) {
  return (
    <div className={className}>
      {property && property.lat && property.lng && (
        <Script
          defer
          suppressHydrationWarning
          id='property-map-init'
          dangerouslySetInnerHTML={{
            __html: addPropertyMapScripts(property),
          }}
        />
      )}
    </div>
  );
}
