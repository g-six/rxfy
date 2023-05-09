'use client';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { createListingTabs } from '@/_typings/agent-my-listings';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, useState } from 'react';
import CreateListingTabs from './CreateListingTabs';
import CurrentTabContent from './CurrentTabContent';

type Props = {
  child: ReactElement;
};

export default function NewOrEditListingTab({ child }: Props) {
  const [currentTab, setCurrentTab] = useState<string>(createListingTabs.AI);

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['w-tab-menu']),
      transformChild: child => <CreateListingTabs child={child} currentTab={currentTab} setCurrentTab={setCurrentTab} />,
    },
    {
      searchFn: searchByClasses(['tabs-content-2', 'w-tab-content']),
      transformChild: child => <CurrentTabContent child={child} currentTab={currentTab} setCurrentTab={setCurrentTab} />,
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
