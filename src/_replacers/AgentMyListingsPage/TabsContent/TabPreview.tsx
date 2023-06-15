import React from 'react';

import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { convertPrivateListingToPropertyData } from '@/_helpers/mls-mapper';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';

import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { RxDetailedListing } from '@/components/full-pages/RxDetailedListing';

export default function TabPreview({ template, initialState, agent }: TabContentProps) {
  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, initialState);
  const property = convertPrivateListingToPropertyData(data as PrivateListingData);

  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['text-area']),
      transformChild: child =>
        React.cloneElement(child, {
          className: `${child.props.className} resize-none`,
          value: property?.description,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            fireEvent({ prompt: e.currentTarget.value });
          },
        }),
    },
  ];

  const Replaced = <>{transformMatchingElements(template, matches)}</>;

  return data ? (
    <RxDetailedListing property={property} agent={agent} nodeClassName={WEBFLOW_NODE_SELECTOR.PROPERTY_PAGE} nodeProps={template.props} nodes={[Replaced]} />
  ) : (
    <></>
  );
}
