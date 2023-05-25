import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, useState } from 'react';
import ChipsList from './ChipList';
import { ValueInterface } from '@/_typings/ui-types';

type Props = {
  template: ReactElement;
  label?: string;
  chipsList: ValueInterface[];
  values: ValueInterface[];
  handleSelect: (val: ValueInterface) => void;
};

export default function ChipsWithLabel({ template, label, values, chipsList, handleSelect }: Props) {
  const matches: tMatch[] = [
    { searchFn: searchByPartOfClass(['f-field-label']), transformChild: child => cloneElement(child, {}, label ?? child.props.children) },
    {
      searchFn: searchByPartOfClass(['chips-wrapper']),
      transformChild: child => <ChipsList template={child} values={values} handleSelect={handleSelect} chipsList={chipsList} />,
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
