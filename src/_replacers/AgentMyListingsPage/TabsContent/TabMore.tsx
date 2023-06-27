import { removeKeys, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { cloneElement } from 'react';
import MoreFieldsModalWrapper from './MoreFieldsModal';

import { fireCustomEvent } from '@/_helpers/functions';
import { Events } from '@/hooks/useEvent';
type Props = {};

export default function TabMore({ template, attributes }: TabContentProps) {
  const moreFilters = removeKeys(attributes, ['amenities', 'connected_services', 'building_styles']);

  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['darker']),
      transformChild: child =>
        cloneElement(child, {
          onClick: () => {
            fireCustomEvent({ show: true }, Events.CompareFiltersModal);
          },
        }),
    },
    {
      searchFn: searchByPartOfClass(['additional-fields-modal']),
      transformChild: child => <MoreFieldsModalWrapper child={child} filters={moreFilters} setFilters={() => {}} />,
    },
  ];

  return <>{transformMatchingElements(template, matches)}</>;
}
