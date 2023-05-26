'use client';
import React, { ReactElement } from 'react';

import { PropertyDataModel } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import RxMapOfListing, { MapType } from '@/components/RxMapOfListing';

type PropertyMapsProps = {
  property: PropertyDataModel | undefined;
  child: React.ReactElement;
};

export default function RxPropertyMaps({ child, property }: PropertyMapsProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['right-side']),
      transformChild: (child: ReactElement) => {
        return (
          <RxMapOfListing
            key={'neighborhood-view'}
            property={property ? property : null}
            mapQuerySelector={'.right-side'}
            mapType={MapType.NEIGHBORHOOD}
            child={child}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['street-view-div']),
      transformChild: (child: ReactElement) => {
        return (
          <RxMapOfListing
            key={'street-view'}
            property={property ? property : null}
            mapQuerySelector={'.street-view-div'}
            mapType={MapType.STREET}
            child={child}
          />
        );
      },
    },
  ];

  return <>{transformMatchingElements(child, matches)}</>;
}
