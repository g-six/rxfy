import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { Dispatch, ReactElement, SetStateAction } from 'react';
import Tabs from '../DashboardSavedHomesPage/Tabs';
import { createListingTabs } from '@/_typings/agent-my-listings';
type Props = {
  child: ReactElement;
  currentTab: string;
  setCurrentTab: Dispatch<SetStateAction<string>>;
  tabs?: { [key: string]: string };
};

export default function CreateListingTabs({ child, currentTab, setCurrentTab, tabs = createListingTabs }: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['w-tab-menu']),
      transformChild: child => <Tabs child={child} currentTab={currentTab} setCurrentTab={setCurrentTab} tabs={tabs} />,
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
