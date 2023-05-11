'use client';
import { captureMatchingElements } from '@/_helpers/dom-manipulators';
import { getSearches } from '@/_utilities/api-calls/call-saved-search';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, use, useEffect, useState } from 'react';
import MyHomeAlertCard from './MyHomeAlertCard';
import { SavedSearch } from '@/_typings/saved-search';

type Props = {
  child: ReactElement;
};

export default function MyHomeAlertsList({ child }: Props) {
  const { card } = captureMatchingElements(child, [{ elementName: 'card', searchFn: searchByClasses(['home-alert-div']) }]);
  const [savedList, setSavedList] = useState<SavedSearch[]>([]);
  useEffect(() => {
    getSearches().then(res => {
      setSavedList(res);
    });
  }, []);

  return <>{cloneElement(child, {}, [savedList.map(item => <MyHomeAlertCard key={item?.id} child={card} data={item} />)])}</>;
}
