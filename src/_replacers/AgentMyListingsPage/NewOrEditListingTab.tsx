'use client';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';

import { AgentData } from '@/_typings/agent';
import { PageTabs, createListingTabs } from '@/_typings/agent-my-listings';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

import CreateListingTabs from './CreateListingTabs';
import CurrentTabContent from './CurrentTabContent';

type Props = {
  child: ReactElement;
  agent: AgentData;
  isActive: boolean;
  changeTab(tab: PageTabs): void;
};

export default function NewOrEditListingTab({ child, agent, isActive, changeTab }: Props) {
  const [currentTab, setCurrentTab] = useState<string>(createListingTabs.AI);
  useEffect(() => {
    !isActive && setCurrentTab(createListingTabs.AI);
  }, [isActive]);
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['tab-pane-private-listings']),
      transformChild: child => cloneElement(child, { className: `${child.props.className} ${isActive ? 'w--tab-active' : ''}` }),
    },
    {
      searchFn: searchByClasses(['w-tab-menu']),
      transformChild: child => <CreateListingTabs child={child} currentTab={currentTab} setCurrentTab={setCurrentTab} />,
    },
    {
      searchFn: searchByClasses(['tabs-content-2', 'w-tab-content']),
      transformChild: child => <CurrentTabContent child={child} currentTab={currentTab} setCurrentTab={setCurrentTab} agent={agent} changeTab={changeTab} />,
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
