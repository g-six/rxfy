import React, { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react';

import { AgentData } from '@/_typings/agent';
import { ValueInterface } from '@/_typings/ui-types';
import { PageTabs, createListingTabs } from '@/_typings/agent-my-listings';
import { captureMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { getPropertyAttributes } from '@/_utilities/api-calls/call-property-attributes';
import { createOrUpdate } from '@/_utilities/api-calls/call-private-listings';
import { getUploadUrl } from '@/_utilities/api-calls/call-uploader';
import useEvent, { Events } from '@/hooks/useEvent';

import TabAi from './TabsContent/TabAi';
import TabAddress from './TabsContent/TabAddress';
import TabSummary from './TabsContent/TabSummary';
import TabSize from './TabsContent/TabSize';
import TabRooms from './TabsContent/TabRooms/TabRooms';
import TabStrata from './TabsContent/TabStrata';
import TabMore from './TabsContent/TabMore';
import TabPreview from './TabsContent/TabPreview';
import useFormEvent, { EventsData, PrivateListingData } from '@/hooks/useFormEvent';

type Props = {
  child: ReactElement;
  currentTab: string;
  setCurrentTab: Dispatch<SetStateAction<string>>;
  data: any | undefined;
  setData: (data: any) => void;
  agent: AgentData;
  changeTab: (tab: PageTabs) => void;
};

export default function CurrentTabContent({ child, currentTab, setCurrentTab, data, setData, agent, changeTab }: Props) {
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
  const formEvt = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  const [attributes, setAttributes] = useState<{ [key: string]: ValueInterface[] }>();
  const { fireEvent } = useEvent(Events.AgentMyListings, true);
  const uploadEvt = useEvent(Events.QueueUpload);
  const [uploading, toggleUploading] = useState<boolean>(false);
  const tabsTemplates = captureMatchingElements(
    child,
    Object.values(createListingTabs).map(tab => ({
      elementName: tab,
      searchFn: searchByPartOfClass([`${tab}-content`]),
    })),
  );

  useEffect(() => {
    // Monitor shifting tab focus and upload photos in queue
    if (formEvt?.data?.photos && !uploading) {
      toggleUploading(true);
      Promise.all(
        formEvt.data.photos.map(async (file, idx) => {
          if (file.name && file.preview && data?.id) {
            const { upload_url } = await getUploadUrl(`${agent.agent_id}/private-listings/${data.id}/${idx}-${file.name}`, file);

            uploadEvt.fireEvent({
              file,
              upload_url,
            } as unknown as EventsData);

            return { position: idx + 1, upload_url };
          }
          return { position: idx + 1 };
        }),
      )
        .then((uploads: { position: number; upload_url?: string }[]) => {
          console.log({ uploads });
        })
        .finally(() => {
          toggleUploading(false);
        });
    }
  }, [currentTab]);

  useEffect(() => {
    getPropertyAttributes().then((res: { [key: string]: { id: number; name: string }[] }) => setAttributes(res));
  }, []);

  const CurrentTabComponent = tabsComponents[currentTab as keyof typeof tabsComponents];
  const tabsOrder = Object.keys(tabsComponents);

  const saveAndExit = async (data: any) => {
    return createOrUpdate(data, record => {
      if (record?.id) {
        setData({ id: record.id });
        fireEvent({ metadata: { ...record } });
        changeTab('my-listings');
        setCurrentTab('tab-ai');
      }
    });
  };

  const nextStepClick = () => {
    const currentStepIndex = tabsOrder.findIndex(tab => tab === currentTab);
    const nextStepIndex = currentStepIndex < tabsOrder.length ? currentStepIndex + 1 : currentStepIndex;
    if (nextStepIndex !== currentStepIndex) {
      createOrUpdate(data, record => {
        if (record?.id) {
          setData({ id: record.id });
        }
        setCurrentTab(tabsOrder[nextStepIndex]);
      });
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
