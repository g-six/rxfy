'use client';
import { PropertyDataModel } from '@/_typings/property';

import RxPropertyCard from '@/components/RxCards/RxPropertyCard';
import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { getSimilarProperties } from '@/_utilities/api-calls/call-properties';
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

export default function RecentListings({
  children,
  className,
  property,
}: {
  children: ReactElement;
  className: string;
  property: { similar_listings?: PropertyDataModel[] };
}) {
  const [ready, toggleReady] = useState<boolean>(false);

  useEffect(() => {
    toggleReady(true);
  }, []);

  return (
    <div className={className}>
      {ready ? (
        <Iterator listings={property.similar_listings || []}>{children}</Iterator>
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
