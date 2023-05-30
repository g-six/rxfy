import React from 'react';

import { PropertyDataModel } from '@/_typings/property';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { building_stats, financial_stats, main_stats } from '@/_utilities/data-helpers/property-page';

import RxPdfStatsInfo from '@/components/RxProperty/RxPropertyPdf/RxPdfStatsInfo';

type ReplacerMainPdfProps = {
  child: React.ReactElement;
  property: PropertyDataModel | undefined;
  size?: 'a4' | 'us' | undefined;
};

export default function RxPdfMainStats({ property, child, size }: ReplacerMainPdfProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['main-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property as PropertyDataModel & { [key: string]: string }}
            nodeClassName={child.props.className}
            child={child}
            stats={main_stats}
            wrapperClassName={'main-info-rows'}
            keyStr={'PIStat'}
            valStr={'PIResult'}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['building-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property as PropertyDataModel & { [key: string]: string }}
            nodeClassName={child.props.className}
            child={child}
            stats={building_stats}
            wrapperClassName={'build-info-rows'}
            keyStr={'PIStat'}
            valStr={'PIResult'}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['financial-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property as PropertyDataModel & { [key: string]: string }}
            nodeClassName={child.props.className}
            child={child}
            stats={financial_stats}
            wrapperClassName={'financial-info-rows'}
            keyStr={'FinStat'}
            valStr={'FinResult'}
          />
        );
      },
    },
  ];

  const style = Object.assign({}, child.props.style, {
    maxHeight: size === 'a4' ? 'auto' : '400px',
  });

  return <>{transformMatchingElements(child, matches)}</>;
}
