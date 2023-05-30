'use client';
import React from 'react';

import { PropertyDataModel } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { combineAndFormatValues } from '@/_utilities/data-helpers/property-page';
import { replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { getPageImgSize, MAIN_INFO_PART } from '@/_helpers/pdf-renderer';

type ReplacerMainPdfProps = {
  child: React.ReactElement;
  property: PropertyDataModel | undefined;
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
          'Building Type': property?.property_type,
          'Property Tax': combineAndFormatValues({
            L_GrossTaxes: Number(property?.gross_taxes),
            ForTaxYear: Number(property?.tax_year),
          }),
          'MLS Number': property?.mls_id,
          'Land Title': property?.land_title,
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
                maxHeight: Math.round(pdfSize.height * MAIN_INFO_PART) - (size === 'a4' ? 395 : 396) + 'px',
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
