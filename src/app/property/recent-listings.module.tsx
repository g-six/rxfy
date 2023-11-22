'use client';
import { PropertyDataModel } from '@/_typings/property';
import { retrievePublicListingsFromPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { getReverseGeo } from '@/_utilities/api-calls/call-mapbox';
import { must_not } from '@/_utilities/api-calls/call-legacy-search';

import RxPropertyCard from '@/components/RxCards/RxPropertyCard';
import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { getMLSProperty, getSimilarProperties } from '@/_utilities/api-calls/call-properties';
import AlicantePropcard from './alicante-propcard.module';
import SpinningDots from '@/components/Loaders/SpinningDots';

function Iterator({ children, listings }: { children: ReactElement; listings: PropertyDataModel[] }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children && typeof c.props.children !== 'string') {
      if (c.props?.className?.includes('is-card') || c.props?.className?.split(' ').includes('property-card') || c.props?.['data-group'] === 'similar_home') {
        return (
          <>
            {listings.map(listing => {
              return c.props?.className?.includes('is-card') ? (
                <AlicantePropcard key={listing.mls_id} listing={listing}>
                  {c}
                </AlicantePropcard>
              ) : (
                <RxPropertyCard key={listing.mls_id} listing={listing}>
                  {c}
                </RxPropertyCard>
              );
            })}
          </>
        );
      }

      return cloneElement(c, {}, <Iterator listings={listings}>{c.props.children}</Iterator>);
    }
    return c;
  });

  return <>{Rexified}</>;
}

export default function RecentListings({ children, className, property }: { children: ReactElement; className: string; property: PropertyDataModel }) {
  const [listings, setListings] = useState<PropertyDataModel[]>([]);
  const [ready, toggleReady] = useState<boolean>(false);

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
    // Keeping it simple for now
    toggleReady(false);
    getSimilarProperties({
      lat,
      lon,
      mls_id,
      beds,
      property_type,
      postal_zip_code,
      complex_compound_name,
    }).then(results => {
      setListings(results);
      toggleReady(true);
    });
  }, []);

  return (
    <div className={className}>
      {ready ? (
        <Iterator listings={listings}>{children}</Iterator>
      ) : (
        <div className='flex justify-between items-center w-full max-w-lg'>
          <SpinningDots className='w-12 h-12' />
          <SpinningDots className='w-12 h-12' />
          <SpinningDots className='w-12 h-12' />
        </div>
      )}
    </div>
  );
}
