'use client';
import { PropertyDataModel } from '@/_typings/property';
import { retrievePublicListingsFromPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { getReverseGeo } from '@/_utilities/api-calls/call-mapbox';
import { must_not } from '@/_utilities/api-calls/call-legacy-search';

import RxPropertyCard from '@/components/RxCards/RxPropertyCard';
import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { getMLSProperty, getSimilarProperties } from '@/_utilities/api-calls/call-properties';
import AlicantePropcard from './alicante-propcard.module';

function Iterator({ children, listings }: { children: ReactElement; listings: PropertyDataModel[] }) {
  const [Rexified] = Children.map(children, c => {
    if (c.props?.className?.includes('is-card')) {
      return (
        <>
          {listings.map(listing => {
            return (
              <AlicantePropcard key={listing.mls_id} listing={listing}>
                {c}
              </AlicantePropcard>
            );
          })}
        </>
      );
    }
  });

  return <>{Rexified}</>;
}

export default function RecentListings({ children, className, property }: { children: ReactElement; className: string; property: PropertyDataModel }) {
  const [listings, setListings] = useState<PropertyDataModel[]>([]);
  const { lat, lon, mls_id, property_type, beds, postal_zip_code, complex_compound_name } = property as {
    lat: number;
    lon: number;
    beds: number;
    mls_id: string;
    style_type: string;
    property_type: string;
    postal_zip_code: string;
    complex_compound_name: string;
  };
  let bounds: number[] = [];
  useEffect(() => {
    getReverseGeo(lon, lat).then(({ data }) => {
      const { features } = data;
      if (features)
        features.forEach((feature: { bbox: number[]; place_type: string[] }) => {
          const { bbox, place_type } = feature;
          if (bounds && bounds.length === 0) bounds = bbox;
          if (place_type.includes('neighborhood')) {
            bounds = bbox;
          }
        });

      getSimilarProperties({
        lat,
        lon,
        mls_id,
        beds,
        property_type,
        postal_zip_code,
        complex_compound_name,
      }).then(setListings);
    });
  }, []);

  return (
    <div className={className}>
      <Iterator listings={listings}>{children}</Iterator>
    </div>
  );
}
