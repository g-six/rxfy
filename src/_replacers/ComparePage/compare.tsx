'use client';
import React, { cloneElement, ReactElement, useEffect, useState } from 'react';
import { ReplacerPageProps } from '@/_typings/forms';
import SelectHomesWrapper from './SelectHomesWrapper';
import { searchByClasses, searchById } from '@/_utilities/rx-element-extractor';
import { Filter, MLSPropertyExtended } from '@/_typings/filters_compare';
import ComparePropertiesList from './ComparePropertiesList';
import FiltersModalWrapper from './FiltersModalWrapper';

import { getDefaults } from '@/_helpers/functions';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';

export default function CompareReplacer({ nodes, config }: ReplacerPageProps) {
  // const data = useCompareComponent();
  const [filters, setFilters] = useState<Filter[]>(getDefaults());
  const [properties, setProperties] = useState<MLSPropertyExtended[]>([]);
  useEffect(() => {
    console.log(properties);
  }, [properties]);
  const matches = [
    {
      searchFn: searchByClasses(['add-homes-btn-trigger']),
      transformChild: (child: ReactElement) =>
        cloneElement(child, {
          onClick: () => {
            document.dispatchEvent(new CustomEvent('add-homes-click', { detail: {} }));
          },
        }),
    },
    {
      searchFn: searchByClasses(['filters-btn-trigger']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          child,
          {
            onClick: () => {
              document.dispatchEvent(new CustomEvent('filters-click', { detail: {} }));
              console.log('click sent');
            },
          },
          child.props.children,
        ),
    },

    {
      searchFn: searchById('modal-compare-add-homes'),
      transformChild: (child: ReactElement) => {
        return (
          <SelectHomesWrapper
            setProperties={setProperties}
            config={config}
            items={properties}
            child={cloneElement(child, {
              onClick: (e: React.SyntheticEvent) => {
                e.stopPropagation();
              },
            })}
            dataset={{}}
          />
        );
      },
    },
    {
      searchFn: searchById('modal-compare-filters'),
      transformChild: (child: ReactElement) => {
        return <FiltersModalWrapper child={child} filters={filters} setFilters={setFilters} />;
      },
    },
    {
      searchFn: searchByClasses(['compare-cards-list']),
      transformChild: (child: ReactElement) => <ComparePropertiesList filters={filters} properties={properties} child={child} />,
    },
    {
      searchFn: searchByClasses(['compare-empty-state']),
      transformChild: (child: ReactElement) => {
        return properties?.length > 0 ? <></> : cloneElement(child, { ...child.props });
      },
    },
  ];

  return <div className='compare-replace-wrapper'>{transformMatchingElements(nodes, matches)}</div>;
}
