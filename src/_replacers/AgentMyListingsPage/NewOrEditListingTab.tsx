'use client';
import React, { ReactElement, cloneElement, useState } from 'react';

import { AgentData } from '@/_typings/agent';
import { PageTabs, createListingTabs } from '@/_typings/agent-my-listings';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';

import CreateListingTabs from './CreateListingTabs';
import CurrentTabContent from './CurrentTabContent';

type Props = {
  child: ReactElement;
  agent: AgentData;
  isActive: boolean;
  changeTab: (tab: PageTabs) => void;
};

export default function NewOrEditListingTab({ child, agent, isActive, changeTab }: Props) {
  const [currentTab, setCurrentTab] = useState<string>(createListingTabs.AI);
  const { data } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, { floor_area_uom: 'sqft', lot_uom: 'sqft' });

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
      transformChild: child => (
        <CurrentTabContent child={child} currentTab={currentTab} setCurrentTab={setCurrentTab} data={data} agent={agent} changeTab={changeTab} />
      ),
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
