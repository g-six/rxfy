'use client';
import React from 'react';

import { MLSProperty } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { combineAndFormatValues } from '@/_utilities/data-helpers/property-page';
import { replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { getPageImgSize, MAIN_INFO_PART } from '@/_helpers/pdf-renderer';

type ReplacerMainPdfProps = {
  child: React.ReactElement;
  property: MLSProperty | undefined;
  imgPhoto: string;
  imgMap: string;
  size?: 'a4' | 'us' | undefined;
};

export default function RxPdfMainInfo({ property, child, imgMap, imgPhoto, size }: ReplacerMainPdfProps) {
  const pdfSize = getPageImgSize(size);
  const matches = [
    {
      searchFn: searchByClasses(['stat-level2']),
      transformChild: (child: React.ReactElement) =>
        replaceAllTextWithBraces(child, {
          'Building Type': property?.PropertyType,
          'Property Tax': combineAndFormatValues({
            L_GrossTaxes: property?.L_GrossTaxes || '',
            ForTaxYear: property?.ForTaxYear || '',
          }),
          'MLS Number': property?.MLS_ID,
          'Land Title': property?.LandTitle,
        }) as React.ReactElement,
    },
    {
      searchFn: searchByClasses(['b-featimage']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          style: imgPhoto
            ? {
                backgroundImage: `url(${imgPhoto})`,
                backgroundPosition: 'center center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                maxHeight: size === 'a4' ? Math.round(pdfSize.height * MAIN_INFO_PART) - 395 + 'px' : 'auto',
              }
            : {},
        });
      },
    },
    {
      searchFn: searchByClasses(['b-map']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          style: imgMap
            ? {
                backgroundImage: `url(${imgMap})`,
                backgroundPosition: 'center center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
              }
            : {},
        });
      },
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
