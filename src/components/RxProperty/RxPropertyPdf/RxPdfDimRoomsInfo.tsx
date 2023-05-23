'use client';
import React from 'react';

import { PropertyDataModel } from '@/_typings/property';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/searchFnUtils';

import RxPdfRoomStats from '@/components/RxProperty/RxPropertyPdf/RxPdfRoomStats';
import RxPdfStatsInfo from '@/components/RxProperty/RxPropertyPdf/RxPdfStatsInfo';
import { dimension_stats } from '@/_utilities/data-helpers/property-page';

type ReplacerDimRoomsPdfProps = {
  child: React.ReactElement;
  property: PropertyDataModel | undefined;
};

export default function RxPdfMainInfo({ property, child }: ReplacerDimRoomsPdfProps) {
  const matches = [
    {
      searchFn: searchByClasses(['rooms-info']),
      transformChild: (child: React.ReactElement) => {
        return <RxPdfRoomStats property={property as PropertyDataModel & { [key: string]: string }} nodeClassName={child.props.className} child={child} />;
      },
    },
    {
      searchFn: searchByClasses(['dimensions-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property as PropertyDataModel & { [key: string]: string }}
            nodeClassName={child.props.className}
            child={child}
            stats={dimension_stats}
            wrapperClassName={'dimentions-info-rows'}
            keyStr={'dimstat'}
            valStr={'dimresult'}
          />
        );
      },
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
