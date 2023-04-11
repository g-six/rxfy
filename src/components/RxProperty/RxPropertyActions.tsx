'use client';
import React from 'react';
import { Transition } from '@headlessui/react';

import { MLSProperty } from '@/_typings/property';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements, replaceAllTextWithBraces } from '@/_helpers/findElements';

type PropertyActionsProps = {
  children: React.ReactNode;
  property: MLSProperty;
  className?: string;
};

export default function RxPropertyActions(props: PropertyActionsProps) {
  const matches = [
    {
      searchFn: searchByClasses(['price-n-address']),
      transformChild: (child: React.ReactElement) =>
        replaceAllTextWithBraces(child, {
          Price: formatValues(props.property, 'AskingPrice'),
          Address: props.property.Address,
        }) as React.ReactElement,
    },
  ];
  return (
    <Transition
      key='confirmation'
      show={true}
      as={React.Fragment}
      enter='transform ease-out duration-300 transition'
      enterFrom='translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'
      enterTo='translate-y-0 opacity-100 sm:translate-x-0'
      leave='transition ease-in duration-100'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
    >
      <section className={props.className}>{transformMatchingElements(props.children, matches)}</section>
    </Transition>
  );
}
