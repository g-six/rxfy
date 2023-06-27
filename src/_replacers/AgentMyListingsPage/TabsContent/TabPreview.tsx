import React, { cloneElement } from 'react';

import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { convertPrivateListingToPropertyData } from '@/_helpers/mls-mapper';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';

import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { RxDetailedListing } from '@/components/full-pages/RxDetailedListing';

export default function TabPreview({ template, initialState, agent }: TabContentProps) {
  const { data } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, initialState);

  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['pl-preview-wrapper']),
      transformChild: child => cloneElement(child, {}),
    },
  ];

  return data ? (
    <div className='flex flex-col h-full'>
      {transformMatchingElements(template, matches)}{' '}
      <iframe
        style={{ border: 'none' }}
        className='h-1/2 flex-grow'
        key={'iframe'}
        width={`100%`}
        src={`/preview?lid=${data.id}&theme=default&paragon=${agent.agent_id}`}
      ></iframe>
    </div>
  ) : (
    <></>
  );
}
