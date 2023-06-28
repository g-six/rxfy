import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { removeClasses } from '@/_helpers/functions';
import { getMyPrivateListings } from '@/_utilities/api-calls/call-private-listings';
import { getAgentPublicListings } from '@/_utilities/api-calls/call-properties';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import MyListingsCard from './MyListingsCard';
import MyListingPrivateCard from './MyListingPrivateCard';
import useEvent, { Events } from '@/hooks/useEvent';

type Props = {
  isActive: boolean;
  child: ReactElement;
  setCurrentTab: () => void;
};

export default function MyListingsTab({ child, isActive, setCurrentTab }: Props) {
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
    { searchFn: searchByClasses(['f-button-neutral-5', 'w-button']), transformChild: child => cloneElement(child, { onClick: () => {} }) },
    {
      searchFn: searchByClasses(['my-listings-tab-content']),
      transformChild: child =>
        cloneElement(child, { className: `${removeClasses(child.props.className, ['w--tab-active'])} ${isActive ? 'w--tab-active' : ''}` }),
    },
    {
      searchFn: searchByClasses(['mls-listings']),
      transformChild: child =>
        cloneElement(child, {}, MLSListings ? MLSListings.map((it, i) => <MyListingsCard key={i} template={templates.mlsCard} property={it} />) : []),
    },
    {
      searchFn: searchByClasses(['private-listings']),
      transformChild: child =>
        cloneElement(
          child,
          {},
          privateListings.map((it, i) => <MyListingPrivateCard key={i} template={templates.privateCard} property={it} changeTab={setCurrentTab} />),
        ),
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
