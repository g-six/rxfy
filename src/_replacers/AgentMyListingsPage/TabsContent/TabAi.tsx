import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { cloneElement } from 'react';

export default function TabAi({ template, nextStepClick }: TabContentProps) {
  const matches: tMatch[] = [
    { searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']), transformChild: child => cloneElement(child, { onClick: nextStepClick }) },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
