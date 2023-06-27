import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { removeClasses } from '@/_helpers/functions';
import { PropertyDataModel } from '@/_typings/property';
import { getMyPrivateListings } from '@/_utilities/api-calls/call-private-listings';
import { getAgentPublicListings } from '@/_utilities/api-calls/call-properties';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

import React, { Dispatch, ReactElement, SetStateAction, cloneElement, useEffect, useState } from 'react';

type Props = {
  child: ReactElement;
  isActive: Boolean;
  setCurrentTab: () => void;
};

export default function MyListingsTab({ child, isActive, setCurrentTab }: Props) {
  const [privateListings, setPrivateListings] = useState<any>();
  const [MLSListings, setMLSListings] = useState<any>();
  useEffect(() => {
    getMyPrivateListings().then(res => {
      console.log('private listings', res as unknown as PropertyDataModel);
    });
    // getAgentPublicListings().then(res => {
    //   console.log('mls listings', res);
    //   setMLSListings(res);
    // });
  }, []);
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['my-listings-tab-content']),
      transformChild: child =>
        cloneElement(child, { className: `${removeClasses(child.props.className, ['w--tab-active'])} ${isActive ? 'w--tab-active' : ''}` }),
    },
    {
      searchFn: searchByClasses(['f-button-neutral-5', 'w-button']),
      transformChild: child =>
        cloneElement(child, {
          onClick: () => {
            setCurrentTab();
          },
        }),
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
