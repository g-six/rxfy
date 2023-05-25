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
      searchFn: searchByClasses(['']),
      transformChild: (child: ReactElement) => {
        return (
          <RxMapOfListing
            key={'neighborhood-view'}
            className={child.props.className}
            property={property ? property : null}
            mapQuerySelector={'.right-side'}
            mapType={MapType.NEIGHBORHOOD}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['']),
      transformChild: (child: ReactElement) => {
        return (
          <RxMapOfListing
            key={'street-view'}
            className={child.props.className}
            property={property ? property : null}
            mapQuerySelector={'.street-view-div'}
            mapType={MapType.STREET}
          />
        );
      },
    },
  ];

  return <>{transformMatchingElements(child, matches)}</>;
}
