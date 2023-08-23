import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { getDefaults } from '@/_helpers/functions';
import { Filter } from '@/_typings/filters_compare';
import { MLSProperty } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import CompareCard from '../ComparePage/CompareCard';

import useEvent, { Events } from '@/hooks/useEvent';
import FiltersModalWrapper from '../ComparePage/FiltersModalWrapper';
import { getMLSProperty } from '@/_utilities/api-calls/call-properties';

type Props = {
  child: ReactElement;
};

export default function CompareTab({ child }: Props) {
  const [filters, setFilters] = useState<Filter[]>(getDefaults());
  const [properties, setProperties] = useState<MLSProperty[]>([]);
  const { data } = useEvent(Events.SavedItemsCompareTab);
  const { mls_id } = data || {};
  const { fireEvent: fireModal } = useEvent(Events.CompareFiltersModal, true);
  const processComparedProperties = async (mls_id: string) => {
    const filteredProperties = properties.filter(property => property.MLS_ID !== mls_id);
    const isSameLength = filteredProperties?.length === properties?.length;
    if (isSameLength) {
      const newProperty = await getMLSProperty(mls_id);
      filteredProperties.push(newProperty);
    }
    setProperties([...filteredProperties]);
  };
  useEffect(() => {
    if (mls_id) {
      processComparedProperties(mls_id);
    }
  }, [data]);

  const { card } = captureMatchingElements(child, [{ searchFn: searchByClasses(['propcompare-card-2']), elementName: 'card' }]); //template
  const matches = [
    {
      //show filters modal button
      searchFn: searchByClasses(['new-compare-filter']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            fireModal({ show: true });
          },
        });
      },
    },
    {
      //filters modal
      searchFn: searchByClasses(['filter-modal']),
      transformChild: (child: ReactElement) => {
        return <FiltersModalWrapper child={child} filters={filters} setFilters={setFilters} />;
      },
    },
    {
      searchFn: searchByClasses(['compare-right']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {}, [
          properties.map(p => {
            return <CompareCard child={card} key={p.MLS_ID} property={p} filters={filters} showControls />;
          }),
        ]);
      },
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
