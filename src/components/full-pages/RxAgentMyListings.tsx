'use client';
import React, { ReactElement, createElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { removeKeys, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';

import NewOrEditListingTab from '@/_replacers/AgentMyListingsPage/NewOrEditListingTab';

import { removeClasses } from '@/_helpers/functions';
import MyListingsTab from '@/_replacers/AgentMyListingsPage/MyListingsTab';
import { PageTabs } from '@/_typings/agent-my-listings';
import { createPrivateListing } from '@/_utilities/api-calls/call-private-listings';
import useFormEvent, { Events } from '@/hooks/useFormEvent';
import SidebarTabs from '@/_replacers/AgentMyListingsPage/SidebarTabs';

type Props = {
  nodeProps: {
    [x: string]: string;
  };
  agent_data: AgentData;
  nodes: ReactElement[];
};

export default function RxAgentMyListings({ nodeProps, agent_data, nodes }: Props) {
  const [currentTab, setCurrentTab] = useState<PageTabs>('my-listings');

  const changeTab = (tab: PageTabs) => {
    setCurrentTab(tab);
  };

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['dash-tabs']),
      transformChild: child => <SidebarTabs template={child} currentTab={currentTab} setCurrentTab={setCurrentTab} />,
    },

    {
      searchFn: searchByClasses(['my-listings-tab-content']),
      transformChild: child => {
        const isCurrent = currentTab === 'my-listings';

        return (
          <MyListingsTab
            isActive={isCurrent}
            child={child}
            setCurrentTab={() => {
              setCurrentTab('private-listing');
            }}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['tab-pane-private-listings']),
      transformChild: child => <NewOrEditListingTab child={child} agent={agent_data} isActive={currentTab === 'private-listing'} changeTab={changeTab} />,
    },
  ];

  return <div className={nodeProps?.className}>{transformMatchingElements(nodes, matches)}</div>;
}
