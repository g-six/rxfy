import React, { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import { ValueInterface } from '@/_typings/ui-types';
import { PageTabs, createListingTabs } from '@/_typings/agent-my-listings';
import { captureMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { getPropertyAttributes } from '@/_utilities/api-calls/call-property-attributes';
import { createOrUpdate, uploadListingPhoto } from '@/_utilities/api-calls/call-private-listings';
import useEvent, { Events } from '@/hooks/useEvent';
import TabAi from './TabsContent/TabAi';
import TabAddress from './TabsContent/TabAddress';
import TabSummary from './TabsContent/TabSummary';
import TabSize from './TabsContent/TabSize';
import TabRooms from './TabsContent/TabRooms/TabRooms';
import TabStrata from './TabsContent/TabStrata';
import TabMore from './TabsContent/TabMore';
import TabPreview from './TabsContent/TabPreview';
import useFormEvent, { ImagePreview, PrivateListingData } from '@/hooks/useFormEvent';
import { PrivateListingOutput } from '@/_typings/private-listing';
import axios from 'axios';

type Props = {
  child: ReactElement;
  currentTab: string;
  setCurrentTab: Dispatch<SetStateAction<string>>;
  agent: AgentData;
  changeTab: (tab: PageTabs) => void;
};

export default function CurrentTabContent({ child, currentTab, setCurrentTab, agent, changeTab }: Props) {
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
  const { fireEvent: fireTabEvent } = useEvent(Events.AgentMyListings, true);
  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, { floor_area_uom: 'sqft', lot_uom: 'sqft' });
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
            const photo = await uploadListingPhoto(file, idx, data as unknown as PrivateListingOutput);
            await axios.put(photo.upload_url, file, { headers: { 'Content-Type': file.type } });
            return photo;
          }
          return file;
        }),
      )
        .then((uploads: ImagePreview[]) => {
          if (uploads.length) {
            const photos: string[] = uploads.map(p => p.preview).filter(p => p);
            // if (data?.id && photos.length) updateXPrivateListing(data.id, { photos });
            // formEvt.fireEvent({
            //   ...formEvt.data,
            //   photos: photos.length ? uploads.filter(p => p && p.preview) : undefined,
            // });
          }
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
        // setData({ id: record.id });
        fireTabEvent({ metadata: { ...record } });
        changeTab('my-listings');
        setCurrentTab('tab-ai');
      }
    });
  };

  const nextStepClick = (callback?: (id?: number) => void, dataToAdd?: PrivateListingData) => {
    const currentStepIndex = tabsOrder.findIndex(tab => tab === currentTab);
    const nextStepIndex = currentStepIndex < tabsOrder.length - 1 ? currentStepIndex + 1 : currentStepIndex;

    if (dataToAdd && Object.keys(dataToAdd).length)
      createOrUpdate({ ...dataToAdd, id: data?.id } as unknown as PrivateListingData, record => {
        if (record?.id) {
          console.log('Firing event from CurrentTabContent');
          fireEvent(record);
          // setData({ id: record.id });
        }

        if (nextStepIndex !== currentStepIndex) {
          setCurrentTab(tabsOrder[nextStepIndex]);
        }
        callback && callback(record?.id);
      });
    else if (nextStepIndex !== currentStepIndex) {
      setCurrentTab(tabsOrder[nextStepIndex]);
    }
  };

  return (
    <div className={child.props.className}>
      {tabsTemplates[currentTab] && attributes ? (
        <CurrentTabComponent
          key={currentTab}
          template={tabsTemplates[currentTab]}
          nextStepClick={nextStepClick}
          saveAndExit={saveAndExit}
          attributes={attributes}
          data={data}
          fireEvent={fireEvent}
          agent={agent}
        />
      ) : (
        <> </>
      )}
    </div>
  );
}
