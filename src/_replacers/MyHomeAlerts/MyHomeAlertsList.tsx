'use client';
import { captureMatchingElements } from '@/_helpers/dom-manipulators';
import { getSearches } from '@/_utilities/api-calls/call-saved-search';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, use, useEffect, useState } from 'react';
import MyHomeAlertCard from './MyHomeAlertCard';
import { SavedSearch } from '@/_typings/saved-search';
import { AgentData } from '@/_typings/agent';
import useEvent, { Events } from '@/hooks/useEvent';
import { useSearchParams } from 'next/navigation';

type Props = {
  child: ReactElement;
  agent_data: AgentData;
};

export default function MyHomeAlertsList({ child, agent_data }: Props) {
  const search = useSearchParams();
  const { data, fireEvent } = useEvent(Events.MyHomeAlertsModal);
  const { key, alertData, reload } = data || {};
  const { card } = captureMatchingElements(child, [{ elementName: 'card', searchFn: searchByClasses(['home-alert-div']) }]);
  const [savedList, setSavedList] = useState<SavedSearch[]>([]);

  useEffect(() => {
    getSearches(search.get('customer') ? Number(search.get('customer')) : undefined).then(res => {
      setSavedList(res);
    });
  }, []);

  useEffect(() => {
    if (key && reload) {
      setSavedList([...savedList.filter(card => card.id !== key)]);
      fireEvent({ key: undefined, reload: false });
    } else if (alertData && reload) {
      getSearches(search.get('customer') ? Number(search.get('customer')) : undefined).then(res => {
        setSavedList(res);
      });
      fireEvent({ key: undefined, reload: false, alertData: undefined });
    } else if (reload) {
      getSearches(search.get('customer') ? Number(search.get('customer')) : undefined).then(res => {
        setSavedList(res);
      });
      fireEvent({ key: undefined, reload: false });
    }
  }, [key, reload, alertData]);

  return (
    <>
      {cloneElement(
        child,
        {},
        savedList?.length > 0 ? [savedList.map(item => <MyHomeAlertCard key={item?.id} child={card} data={item} agent_data={agent_data} />)] : [],
      )}
    </>
  );
}
