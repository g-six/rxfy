import { captureMatchingElements } from '@/_helpers/dom-manipulators';
import React, { Dispatch, ReactElement, SetStateAction, cloneElement, useState } from 'react';
import { createListingTabs } from '@/_typings/agent-my-listings';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import TabAi from './TabsContent/TabAi';
import TabAddress from './TabsContent/TabAddress';
import TabSummary from './TabsContent/TabSummary';
import TabSize from './TabsContent/TabSize';
import TabRooms from './TabsContent/TabRooms';
import TabStrata from './TabsContent/TabStrata';
import TabMore from './TabsContent/TabMore';
import TabPreview from './TabsContent/TabPreview';
type Props = {
  child: ReactElement;
  currentTab: string;
  setCurrentTab: Dispatch<SetStateAction<string>>;
};

export default function CurrentTabContent({ child, currentTab, setCurrentTab }: Props) {
  const tabsComponents = {
    'tab-ai': TabAi,
    'tab-address': TabAddress,
    'tab-summary': TabSummary,
    'tab-size': TabSize,
    'tab-rooms': TabRooms,
    'tab-strata': TabStrata,
    'tab-more': TabMore,
    'tab-preview': TabPreview,
  };
  const [tabsTemplates] = useState(
    captureMatchingElements(
      child,
      Object.values(createListingTabs).map(tab => ({
        elementName: tab,
        searchFn: searchByPartOfClass([`${tab}-content`]),
      })),
    ),
  );
  const CurrentTabComponent = tabsComponents[currentTab as keyof typeof tabsComponents];
  const tabsOrder = Object.keys(tabsComponents);
  const nextStepClick = () => {
    const currentStepIndex = tabsOrder.findIndex(tab => tab === currentTab);
    const nextStepIndex = currentStepIndex < tabsOrder.length ? currentStepIndex + 1 : currentStepIndex;
    setCurrentTab(tabsOrder[nextStepIndex]);
  };
  return (
    <div className={child.props.className}>
      {' '}
      {CurrentTabComponent ? <CurrentTabComponent template={tabsTemplates[currentTab]} nextStepClick={nextStepClick} /> : <> </>}
    </div>
  );
}
