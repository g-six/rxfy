import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { LatLng, mapsViewsTabs } from '@/_typings/agent-my-listings';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, useState } from 'react';
import CreateListingTabs from '../CreateListingTabs';
import CurrentTabContent from '../CurrentTabContent';
import RxMapOfListing, { MapType } from '@/components/RxMapOfListing';
import { removeClasses } from '@/_helpers/functions';

type Props = {
  child: ReactElement;
  coords?: LatLng;
};

export default function MapsTabs({ child, coords }: Props) {
  const [currentTab, setCurrentTab] = useState<string>(mapsViewsTabs.NEIGHBORHOOD);
  const activeTabClassName = 'w--tab-active';

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['w-tab-menu']),

      transformChild: child => {
        return <CreateListingTabs child={child} currentTab={currentTab} setCurrentTab={setCurrentTab} tabs={mapsViewsTabs} />;
      },
    },
    {
      searchFn: searchByPartOfClass([`${mapsViewsTabs.NEIGHBORHOOD}-content`]),
      transformChild: child =>
        cloneElement(
          child,
          { className: `${removeClasses(child.props.className, [activeTabClassName])} ${currentTab === mapsViewsTabs.NEIGHBORHOOD ? activeTabClassName : ''}` },
          coords
            ? [<RxMapOfListing key={0} child={child.props.children[0]} mapType={MapType.NEIGHBORHOOD} property={coords satisfies LatLng} />]
            : child.props.children,
        ),
    },
    {
      searchFn: searchByPartOfClass([`${mapsViewsTabs.STREET}-content`]),
      transformChild: child =>
        cloneElement(
          child,
          { className: `${removeClasses(child.props.className, [activeTabClassName])} ${currentTab === mapsViewsTabs.STREET ? activeTabClassName : ''}` },
          coords
            ? [<RxMapOfListing key={0} child={child.props.children[0]} mapType={MapType.STREET} property={coords satisfies LatLng} />]
            : child.props.children,
        ),
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
