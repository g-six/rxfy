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
import { createPrivateListing, updatePrivateListing, uploadListingPhoto } from '@/_utilities/api-calls/call-private-listings';
import { formatAddress } from '@/_utilities/string-helper';
import { PrivateListingInput, PrivateListingOutput } from '@/_typings/private-listing';

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
  const tabsTemplates = captureMatchingElements(
    child,
    Object.values(createListingTabs).map(tab => ({
      elementName: tab,
      searchFn: searchByPartOfClass([`${tab}-content`]),
    })),
  );
  useEffect(() => {
    getPropertyAttributes().then((res: { [key: string]: { id: number; name: string }[] }) => {
      const remapped = Object.entries(res).map(([key, val]: [string, { id: number; name: string }[]]) => [
        key,
        val.map(({ id, name }) => ({ label: name, value: id })),
      ]);

      setAttributes(Object.fromEntries(remapped));
    });
  }, []);

  const CurrentTabComponent = tabsComponents[currentTab as keyof typeof tabsComponents];
  const tabsOrder = Object.keys(tabsComponents);
  const saveAndExit = async (data: any) => {
    const { id, title, area, baths, beds, city, lat, lon, neighbourhood, postal_zip_code, state_province, dwelling_type, amenities, asking_price } =
      data || ({} as unknown as PrivateListingInput);
    if (id) {
      await updatePrivateListing(id, {
        amenities,
        asking_price,
      });
      changeTab('my-listings');
      setCurrentTab('tab-ai');
      return;
    }
    if (title) {
      createPrivateListing({
        title: formatAddress(title.split(', ').reverse().pop() as string),
        area,
        baths,
        beds,
        city,
        lat,
        lon,
        neighbourhood,
        dwelling_type,
        postal_zip_code,
        state_province,
        amenities,
      } as unknown as PrivateListingInput).then(record => {
        record.json().then((rec: PrivateListingOutput) => {
          changeTab('my-listings');
          setCurrentTab('tab-ai');
          // Update data in events
          // fireEvent({
          //   ...data,
          //   ...(rec as unknown as PrivateListingData),
          // });

          // if (data.photos && rec.id) {
          //   let count = 0;
          //   if (data && data.upload_queue?.count) {
          //     count = data.upload_queue.count as number;
          //   }

          //   data?.photos?.map((photo: File, cnt: number) => {
          //     uploadListingPhoto(photo, cnt + 1, rec).then((upload_item: { success: boolean; upload_url: string; file_path: string }) => {
          //       axios
          //         .put(upload_item.upload_url, photo, {
          //           headers: {
          //             'Content-Type': photo.type,
          //           },
          //         })
          //         .then(r => {
          //           count++;
          //           if (data.photos && data.photos[cnt]) data.photos[cnt].url = 'https://' + new URL(upload_item.upload_url).pathname.substring(1);
          //           fireEvent({
          //             ...data,
          //             upload_queue: {
          //               ...data.upload_queue,
          //               count,
          //               total: data.photos?.length || 0,
          //             },
          //           });
          //         });
          //     });
          //   });
          // }
        });
      });
    }
  };
  const nextStepClick = () => {
    const currentStepIndex = tabsOrder.findIndex(tab => tab === currentTab);
    const nextStepIndex = currentStepIndex < tabsOrder.length ? currentStepIndex + 1 : currentStepIndex;
    setCurrentTab(tabsOrder[nextStepIndex]);
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
