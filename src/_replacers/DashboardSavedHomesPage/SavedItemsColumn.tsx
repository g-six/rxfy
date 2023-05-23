import { captureMatchingElements } from '@/_helpers/dom-manipulators';
import { LovedPropertyDataModel, MLSProperty } from '@/_typings/property';
import React, { ReactElement, cloneElement, useState } from 'react';
import { fireCustomEvent, getCurrentTab } from '@/_helpers/functions';
import { Events, tabEventMapping } from '@/_typings/events';
import { AgentData } from '@/_typings/agent';
import RxSavedCard from '@/components/RxCards/saved-items/RxSavedCard';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import useEvent from '@/hooks/useEvent';

type Props = {
  child: ReactElement;
  loved: LovedPropertyDataModel[];
  agent_data: AgentData;
};

export default function SavedItemsColumn({ loved, child, agent_data }: Props) {
  const { data } = useEvent(Events.SavedItemsCompareTab);
  const [comparedArr, setComparedArr] = useState<string[]>([]);
  React.useEffect(() => {
    if (data?.mls_id) {
      const filteredProperties = comparedArr.filter(id => id !== data.mls_id);
      const isSameLength = filteredProperties?.length === comparedArr?.length;
      isSameLength && filteredProperties.push(data.mls_id);
      setComparedArr(filteredProperties);
    }
  }, [data]);

  const { card } = captureMatchingElements(child, [{ elementName: 'card', searchFn: searchByClasses(['property-card-map']) }]);
  const handleOnCardClick = (mls_id: string) => () => {
    const tabsDom = document.querySelector('.indiv-map-tabs');
    const currentTab: string = tabsDom?.children ? getCurrentTab(Array.from(tabsDom.children)) : 'default';

    fireCustomEvent({ mls_id }, tabEventMapping[currentTab]);
  };
  const propertyCards =
    loved?.length > 0
      ? loved.map((p: LovedPropertyDataModel, sequence_no: number) => {
          const { love, ...listing } = p;

          return (
            <div className='w-full ' key={p.mls_id} onClick={handleOnCardClick(listing.mls_id)}>
              <RxSavedCard
                love={love}
                child={card}
                listing={listing}
                sequence={sequence_no}
                agentId={agent_data.id}
                addBtnClick={(e: React.SyntheticEvent) => {
                  e.stopPropagation();
                  fireCustomEvent({ mls_id: listing.mls_id }, Events.SavedItemsCompareTab);
                }}
                isCompared={comparedArr.some(id => id === listing.mls_id)}
              />
            </div>
          );
        })
      : [];
  return cloneElement(child, {}, [child.props.children[0], ...propertyCards]);
}
