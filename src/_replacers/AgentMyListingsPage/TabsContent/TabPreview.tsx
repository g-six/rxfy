import React, { cloneElement } from 'react';

import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';

import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';

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
      <iframe style={{ border: 'none' }} className='h-1/2 flex-grow' key={'iframe'} width={`100%`} src={`/property?lid=${data.id}&theme=default`}></iframe>
    </div>
  ) : (
    <></>
  );
}
