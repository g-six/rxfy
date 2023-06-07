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
  console.log(currentTab);
  const getTabVal = (child: ReactElement) => {
    const className = child?.props?.className;
    return className?.split(' ')?.find((cls: string) => tabsArray.includes(cls));
  };
  const hasCurrentClass = (className: string) => {
    return className?.split(' ')?.some((cls: string) => cls === 'w--current') ?? false;
  };
  const removeCurrent = (className: string) => {
    return className
      ?.split(' ')
      ?.filter((cls: string) => cls !== 'w--current')
      .join(' ');
  };
  useEffect(() => {
    const children = child?.props?.children;
    if (Array.isArray(children)) {
      children.forEach(child => {
        hasCurrentClass(child?.props?.className) && makeCurrent(child)();
      });
    }
  }, []);
  const matches = [
    {
      searchFn: searchByClasses([savedHomesTabs.INDIVIDUAL]),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: makeCurrent(child),
        });
      },
    },
    {
      searchFn: searchByClasses([savedHomesTabs.MAP_VIEW]),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: makeCurrent(child),
        });
      },
    },
    {
      searchFn: searchByClasses([savedHomesTabs.COMPARE]),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: makeCurrent(child),
        });
      },
    },
  ];

  // const matches = Object.values(tabs).map(tab => ({
  //   searchFn: searchByClasses([tab]),
  //   transformChild: (child: ReactElement) => {
  //     const isCurrent = getTabVal(child) === currentTab;
  //     return cloneElement(child, {
  //       className: `${removeCurrent(child.props.className)} ${isCurrent ? `w--current` : ''}`,
  //       onClick: makeCurrent(child),
  //     });
  //   },
  // }));

  return <>{transformMatchingElements(child, matches)}</>;
}
