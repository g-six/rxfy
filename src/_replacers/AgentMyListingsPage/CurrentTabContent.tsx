import { captureMatchingElements } from '@/_helpers/dom-manipulators';
import React, { Dispatch, ReactElement, SetStateAction, cloneElement, useEffect, useState } from 'react';
import { createListingTabs } from '@/_typings/agent-my-listings';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import TabAi from './TabsContent/TabAi';
import TabAddress from './TabsContent/TabAddress';
import TabSummary from './TabsContent/TabSummary';
import TabSize from './TabsContent/TabSize';
import TabRooms from './TabsContent/TabRooms/TabRooms';
import TabStrata from './TabsContent/TabStrata';
import TabMore from './TabsContent/TabMore';
import TabPreview from './TabsContent/TabPreview';
import { getPropertyAttributes } from '@/_utilities/api-calls/call-property-attributes';
import { ValueInterface } from '@/_typings/ui-types';
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
  const [attributes, setAttributes] = useState<{ [key: string]: ValueInterface[] }>();
  const [tabsTemplates] = useState(
    captureMatchingElements(
      child,
      Object.values(createListingTabs).map(tab => ({
        elementName: tab,
        searchFn: searchByPartOfClass([`${tab}-content`]),
      })),
    ),
  );
  useEffect(() => {
    getPropertyAttributes().then((res: { [key: string]: { id: number; name: string }[] }) => {
      const remapped = Object.entries(res).map(([key, val]: [string, { id: number; name: string }[]]) => [
        key,
        val.map(({ id, name }) => ({ label: name, value: id })),
      ]);
      console.log(remapped);

      setAttributes(Object.fromEntries(remapped));
    });
  }, []);

  const CurrentTabComponent = tabsComponents[currentTab as keyof typeof tabsComponents];
  const tabsOrder = Object.keys(tabsComponents);
  const nextStepClick = () => {
    const currentStepIndex = tabsOrder.findIndex(tab => tab === currentTab);
    const nextStepIndex = currentStepIndex < tabsOrder.length ? currentStepIndex + 1 : currentStepIndex;
    setCurrentTab(tabsOrder[nextStepIndex]);
  };
  return (
    <div className={child.props.className}>
      {tabsTemplates[currentTab] && attributes ? (
        <CurrentTabComponent template={tabsTemplates[currentTab]} nextStepClick={nextStepClick} attributes={attributes} />
      ) : (
        <> </>
      )}
    </div>
  );
}
