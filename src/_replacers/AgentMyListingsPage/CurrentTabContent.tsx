import React, { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react';

import { AgentData } from '@/_typings/agent';
import { ValueInterface } from '@/_typings/ui-types';
import { PageTabs, createListingTabs } from '@/_typings/agent-my-listings';
import { captureMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { getPropertyAttributes } from '@/_utilities/api-calls/call-property-attributes';
import TabAi from './TabsContent/TabAi';
import TabAddress from './TabsContent/TabAddress';
import TabSummary from './TabsContent/TabSummary';
import TabSize from './TabsContent/TabSize';
import TabRooms from './TabsContent/TabRooms/TabRooms';
import TabStrata from './TabsContent/TabStrata';
import TabMore from './TabsContent/TabMore';
import TabPreview from './TabsContent/TabPreview';
import { createOrUpdate } from '@/_utilities/api-calls/call-private-listings';
import useEvent, { Events } from '@/hooks/useEvent';

type Props = {
  child: ReactElement;
  currentTab: string;
  setCurrentTab: Dispatch<SetStateAction<string>>;
  data: any | undefined;
  agent: AgentData;
  changeTab: (tab: PageTabs) => void;
};

export default function CurrentTabContent({ child, currentTab, setCurrentTab, data, agent, changeTab }: Props) {
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
  const { fireEvent } = useEvent(Events.AgentMyListings, true);
  const tabsTemplates = captureMatchingElements(
    child,
    Object.values(createListingTabs).map(tab => ({
      elementName: tab,
      searchFn: searchByPartOfClass([`${tab}-content`]),
    })),
  );
  useEffect(() => {
    getPropertyAttributes().then((res: { [key: string]: { id: number; name: string }[] }) => {
      setAttributes(res);
    });
  }, []);

  const CurrentTabComponent = tabsComponents[currentTab as keyof typeof tabsComponents];
  const tabsOrder = Object.keys(tabsComponents);

  const saveAndExit = async (data: any) => {
    return createOrUpdate(data, record => {
      fireEvent({ metadata: { ...record } });
      changeTab('my-listings');
      setCurrentTab('tab-ai');
    });
  };

  const nextStepClick = () => {
    const currentStepIndex = tabsOrder.findIndex(tab => tab === currentTab);
    const nextStepIndex = currentStepIndex < tabsOrder.length ? currentStepIndex + 1 : currentStepIndex;
    if (nextStepIndex !== currentStepIndex) {
      createOrUpdate(data, () => setCurrentTab(tabsOrder[nextStepIndex]));
    }
  };
  return (
    <div className={child.props.className}>
      {tabsTemplates[currentTab] && attributes ? (
        <CurrentTabComponent
          template={tabsTemplates[currentTab]}
          nextStepClick={nextStepClick}
          saveAndExit={saveAndExit}
          attributes={attributes}
          initialState={data}
          agent={agent}
        />
      ) : (
        <> </>
      )}
    </div>
  );
}
