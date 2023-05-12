import { filterPropertyByKeys } from '@/_helpers/compare-page-filtering';
import { BracesReplacements, captureMatchingElements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { mapStrAddress } from '@/_helpers/mls-mapper';
import { Filter } from '@/_typings/filters_compare';
import { MLSProperty } from '@/_typings/property';
import { classNames } from '@/_utilities/html-helper';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { cloneElement, ReactElement } from 'react';
import { usePathname } from 'next/navigation';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events } from '@/_typings/events';

type Props = {
  property: MLSProperty;
  child: ReactElement;
  replacements?: BracesReplacements;
  filters: Filter[];
  showControls?: boolean;
};

export default function CompareCard({ property, child, replacements, filters, showControls = true }: Props) {
  const currReplacements = replacements ?? {
    'Comp Price': `$${property.asking_price}`,
    'Comp Address': property.title,
    PBd: property.beds,
    PBth: property.baths,
    Psq: property.floor_area,
    PYear: property.year_built,
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
      searchFn: searchByClasses(['propcompare-card-image']),
      transformChild: (child: React.ReactElement) => {
        const prepdClassName = classNames(child.props.className, 'group');
        return cloneElement(child, { ...child.props, className: prepdClassName });
      },
    },
    {
      searchFn: searchByClasses(['compare-control']),
      transformChild: (child: React.ReactElement) => {
        const prepdClassName = classNames(child.props.className, 'group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none  opacity-0');
        return cloneElement(child, {
          className: prepdClassName,
          style: { width: 'auto' },
        });
      },
    },
    {
      searchFn: searchByClasses(['external-link']),
      transformChild: (child: React.ReactElement) => {
        return (
          <a className='external-link' href={`/property?mls=${property.MLS_ID}`} target='_blank'>
            {child.props.children}
          </a>
        );
      },
    },
    {
      searchFn: searchByClasses(['dots-horizontal']),
      transformChild: (child: React.ReactElement) => {
        const prepdClassName = classNames(child.props.className, 'hidden');
        return cloneElement(child, { className: prepdClassName });
      },
    },
    {
      searchFn: searchByClasses(['x']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            fireCustomEvent({ mls_id: property.MLS_ID }, Events.SavedItemsCompareTab);
          },
        });
      },
    },
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
