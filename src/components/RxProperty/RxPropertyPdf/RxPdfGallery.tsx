'use client';
import React from 'react';

import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

type ReplacerGalleryPdfProps = {
  photos: string[] | string | number;
  child: React.ReactElement;
};

export const PHOTOS_AMOUNT = 9;

export default function RxPdfStatsInfo(props: ReplacerGalleryPdfProps) {
  const rowTemplate = captureMatchingElements(props.child, [
    {
      elementName: 'statRow',
      searchFn: searchByClasses(['b-images']),
    },
  ]);

  const matches = [
    {
      searchFn: searchByClasses(['imagegrid']),
      transformChild: (ch: React.ReactElement) => {
        const array = Array.isArray(props.photos) ? props.photos : [];
        return React.cloneElement(ch, { ...ch.props }, [
          ...array.map((key, i) => {
            return i < PHOTOS_AMOUNT ? (
              React.cloneElement(rowTemplate.statRow, {
                key: i,
                style: {
                  backgroundImage: `url(${key})`,
                  backgroundPosition: 'center center',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                },
              })
            ) : (
              <></>
            );
          }),
        ]);
      },
    },
  ];

  return <>{transformMatchingElements(props.child, matches)}</>;
}
