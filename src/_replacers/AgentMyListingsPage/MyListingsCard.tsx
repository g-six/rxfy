import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import RxDropMenu from '@/components/RxForms/RxDropMenu';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  template: ReactElement;
  property: any;
};

export default function MyListingsCard({ template, property }: Props) {
  const property_bg: { [key: string]: string } = {
    sold: 'status-sold bg-red-400',
    draft: 'status-draft bg-yellow-400',
    active: 'status-active bg-green-400',
    terminated: 'status-sold bg-red-400',
  };
  const bg: string = property_bg[property?.status.toLowerCase() ?? 'draft'];

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['propcard-image']),
      transformChild: child => cloneElement(child, { style: { background: 'url(),   #00000010' } }),
    },
    {
      searchFn: searchByClasses(['propcard-address']),
      transformChild: child => cloneElement(child, {}, [property.title]),
    },
    {
      searchFn: searchByClasses(['property-price']),
      transformChild: child => cloneElement(child, {}, [property.asking_price ? `$${parseInt(property.asking_price).toLocaleString()}` : 'Price Uknown']),
    },
    {
      searchFn: searchByClasses(['area-block']),
      transformChild: child => cloneElement(child, { className: `area-block ${bg} capitalize` }, [`${property?.status ?? 'Draft'}`]),
    },
  ];

  return <>{transformMatchingElements(template, matches)}</>;
}
