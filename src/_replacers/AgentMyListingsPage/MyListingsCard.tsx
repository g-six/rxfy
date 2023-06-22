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
  const commonMatches: tMatch[] = [
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
  ];

  const matches = [...commonMatches];
  return <>{transformMatchingElements(template, matches)}</>;
}
