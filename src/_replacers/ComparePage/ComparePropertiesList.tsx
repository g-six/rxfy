import { mapStrAddress } from '@/_helpers/mls-mapper';
import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { removeClasses } from '@/_helpers/functions';
import { Filter, MLSPropertyExtended } from '@/_typings/filters_compare';
import { classNames } from '@/_utilities/html-helper';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { cloneElement, ReactElement } from 'react';
import CompareCard from './CompareCard';

type Props = { child: ReactElement; properties: MLSPropertyExtended[]; filters: Filter[] };

export default function ComparePropertiesList({ child, properties, filters }: Props) {
  const hasProperties = properties?.length > 0;
  const templatesToFind = [
    {
      elementName: 'cardTemplate',
      searchFn: searchByClasses(['compare-card-template']),
    },
  ];

  const templates = captureMatchingElements(child, templatesToFind);

  const matches = [
    {
      searchFn: searchByClasses(['compare-cards-list']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { ...child.props }, [
          ...properties.map((p: MLSPropertyExtended, i) => {
            const replacements = {
              'Comp Price': `$${p.AskingPrice}`,
              'Comp Address': mapStrAddress(p),
              PBd: p.L_BedroomTotal,
              PBth: p.L_TotalBaths,
              Psq: p.L_FloorArea_GrantTotal,
              PYear: p.L_YearBuilt,
            };
            const addClass = i === 0 ? 'first' : i === properties?.length - 1 ? 'last' : '';
            return hasProperties ? (
              <CompareCard
                filters={filters}
                key={p?.ListingID}
                child={cloneElement(templates.cardTemplate, {
                  ...templates.cardTemplate.props,
                  className: classNames(removeClasses(templates.cardTemplate.props.className, ['first', 'last']), addClass),
                })}
                property={p}
                replacements={replacements}
              />
            ) : (
              child
            );
          }),
        ]);
      },
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
