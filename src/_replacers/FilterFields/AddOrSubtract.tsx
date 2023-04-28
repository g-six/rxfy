import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  template: ReactElement;
  label?: string;
  value: number;
  handleFunc: (val: number) => void;
};

export default function AddOrSubtract({ template, value, handleFunc, label }: Props) {
  const matches: tMatch[] = [
    { searchFn: searchByPartOfClass(['field-label']), transformChild: child => cloneElement(child, {}, label ? [label] : child.props.children) },
    { searchFn: searchByPartOfClass(['beds-baths-title']), transformChild: child => cloneElement(child, {}, [value]) },
    { searchFn: searchByPartOfClass(['-less']), transformChild: child => cloneElement(child, { onClick: () => handleFunc(value - 1) }) },
    { searchFn: searchByPartOfClass(['-more']), transformChild: child => cloneElement(child, { onClick: () => handleFunc(value + 1) }) },
  ];
  return transformMatchingElements(template, matches) as ReactElement;
}
