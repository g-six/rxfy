import React from 'react';
import Script from 'next/script';

import { PropertyDataModel } from '@/_typings/property';
import { addPropertyMapScripts, MapType } from './Scripts/google-street-map';
export { MapType } from './Scripts/google-street-map';

type Props = {
  property: PropertyDataModel | null;
  className: string;
  mapQuerySelector?: string;
  mapType?: MapType | string;
};

export default function RxMapOfListing({ property, className, mapType, mapQuerySelector }: Props) {
  const id = 'property-map-init-' + property?.id + '-' + mapType;
  return (
    <div className={className}>
      {property && property.lat && property.lon && (
        <Script
          defer
          suppressHydrationWarning
          id={id}
          dangerouslySetInnerHTML={{
            __html: addPropertyMapScripts(property, { type: mapType, elementQuerySelector: mapQuerySelector }),
          }}
        />
      )}
    </div>
  );
}
