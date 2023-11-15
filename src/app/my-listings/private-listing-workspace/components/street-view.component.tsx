'use client';

import { LatLng } from '@/_typings/agent-my-listings';
import RxMapOfListing from '@/components/RxMapOfListing';
import { ReactElement } from 'react';

export default function MyListingStreetView({ children, lon, lat }: { children: ReactElement; lon: number; lat: number }) {
  const coords: LatLng = {
    lon: Number(lon),
    lat: Number(lat),
  };
  return (
    <div>
      <RxMapOfListing key={1} child={<>{children}</>} mapType={'street'} property={coords satisfies LatLng} />
    </div>
  );
}
