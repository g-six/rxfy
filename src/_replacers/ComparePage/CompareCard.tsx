import { filterPropertyByKeys } from '@/_helpers/compare-page-filtering';
import { BracesReplacements, captureMatchingElements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { mapStrAddress } from '@/_helpers/mls-mapper';
import { Filter } from '@/_typings/filters_compare';
import { MLSProperty } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { cloneElement, ReactElement } from 'react';

type Props = {
  property: MLSProperty;
  child: ReactElement;
  replacements?: BracesReplacements;
  filters: Filter[];
};

export default function CompareCard({ property, child, replacements, filters }: Props) {
  const currReplacements = replacements ?? {
    'Comp Price': `$${property.AskingPrice}`,
    'Comp Address': mapStrAddress(property),
    PBd: property.L_BedroomTotal,
    PBth: property.L_TotalBaths || property.baths,
    Psq: property.L_FloorArea_GrantTotal,
    PYear: property.L_YearBuilt,
  };
  const rowTemplate = captureMatchingElements(child, [
    {
      elementName: 'statRow',
      searchFn: searchByClasses(['compare-stat']),
    },
  ]);

  const matchedFiltersObj = Object.fromEntries(Object.entries(filterPropertyByKeys({ property, filters })).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));

  const matches = [
    {
      searchFn: searchByClasses(['img-placeholder']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, { ...child.props, src: property?.thumbnail || child.props.src, srcSet: property?.thumbnail || child.props.src });
      },
    },
    {
      searchFn: searchByClasses(['compare-stats-wrapper']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, { ...child.props }, [
          ...Object.entries(matchedFiltersObj).map(([key, val], i) => {
            return replaceAllTextWithBraces(cloneElement(rowTemplate.statRow, { key: i }), { 'Compare Stat Name': key, 'Compare Stat': val });
          }),
        ]);
      },
    },
  ];
  return <>{transformMatchingElements(replaceAllTextWithBraces(child, currReplacements), matches)}</>;
}
