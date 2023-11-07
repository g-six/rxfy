import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { removeClasses } from '@/_helpers/functions';
import { getMyPrivateListings } from '@/_utilities/api-calls/call-private-listings';
import { getAgentPublicListings } from '@/_utilities/api-calls/call-properties';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import MyListingsCard from './MyListingsCard';
import MyListingPrivateCard from './MyListingPrivateCard';
import useEvent, { Events } from '@/hooks/useEvent';
import RxDialog from '@/components/RxDialogs/RxDialog';

type Props = {
  'data-domain': string;
  isActive: boolean;
  child: ReactElement;
  setCurrentTab: () => void;
};

export default function MyListingsTab({ child, isActive, setCurrentTab, ...props }: Props) {
  const { data, fireEvent } = useEvent(Events.AgentMyListings);
  const [MLSListings, setMLSListings] = useState<any[]>([]);
  const [privateListings, setPrivateListings] = useState<any[]>([]);
  const [templates] = useState(
    captureMatchingElements(child, [
      { elementName: 'privateCard', searchFn: searchByClasses(['private-listing-card']) },
      { elementName: 'mlsCard', searchFn: searchByClasses(['mls-listing-card']) },
    ]),
  );
  useEffect(() => {
    getAgentPublicListings().then(res => {
      setMLSListings(res);
    });
    getMyPrivateListings().then(res => {
      setPrivateListings(res.records);
    });
  }, []);

  useEffect(() => {
    if (data?.metadata?.id) {
      setPrivateListings(prev => [...prev.map(it => (it.id === data.metadata.id ? { ...it, ...data.metadata } : it))]);
      fireEvent({ metadata: undefined });
    }
  }, [data?.metadata, fireEvent]);

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['f-button-neutral-5', 'w-button']),
      transformChild: child =>
        cloneElement(child, {
          onClick: () => {
            setCurrentTab();
          },
        }),
    },
    {
      searchFn: searchByClasses(['my-listings-tab-content']),
      transformChild: child =>
        cloneElement(
          child,
          { className: `${removeClasses(child.props.className, ['w--tab-active'])} ${isActive ? 'w--tab-active' : ''}` },
          <>
            {child.props.children}
            <RxDialog />
          </>,
        ),
    },
    {
      searchFn: searchByClasses(['mls-listings']),
      transformChild: child =>
        cloneElement(
          child,
          {},
          MLSListings
            ? MLSListings.map((it, i) => <MyListingsCard data-domain={props['data-domain']} key={i} template={templates.mlsCard} property={it} />)
            : [],
        ),
    },
    {
      searchFn: searchByClasses(['private-listings']),
      transformChild: child =>
        cloneElement(
          child,
          {},
          isActive && privateListings?.map
            ? privateListings.map((it, i) => (
                <MyListingPrivateCard
                  key={i}
                  template={templates.privateCard}
                  property={it}
                  changeTab={setCurrentTab}
                  onDelete={() => {
                    getMyPrivateListings().then(res => {
                      setPrivateListings(res.records);
                    });
                  }}
                />
              ))
            : [],
        ),
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
