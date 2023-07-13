import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { savedHomesTabs } from '@/_typings/saved-homes-tabs';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

import React, { Dispatch, ReactElement, SetStateAction, cloneElement, useEffect } from 'react';

type Props = {
  child: ReactElement;
  currentTab: string;
  setCurrentTab: Dispatch<SetStateAction<string>>;
  tabs?: {
    [key: string]: string;
  };
};

export default function Tabs({ child, currentTab, setCurrentTab, tabs = savedHomesTabs }: Props) {
  const tabsArray: string[] = Object.values(tabs);

  const makeCurrent = (child: ReactElement) => () => {
    setCurrentTab(getTabVal(child) ?? '');
  };

  const getTabVal = (child: ReactElement) => {
    const className = child?.props?.className;
    return className?.split(' ')?.find((cls: string) => tabsArray.includes(cls));
  };

  const removeCurrent = (className: string) => {
    return className
      ?.split(' ')
      ?.filter((cls: string) => cls !== 'w--current')
      .join(' ');
  };

  const matches = [
    ...tabsArray.map(tab => ({
      searchFn: searchByClasses([tab]),
      transformChild: (child: ReactElement) => {
        const isCurrent = getTabVal(child) === currentTab;
        return cloneElement(child, {
          className: `${removeCurrent(child.props.className)} ${isCurrent ? `w--current` : ''}`,
          onClick: makeCurrent(child),
        });
      },
    })),
  ];

  return <>{transformMatchingElements(child, matches)}</>;
}
