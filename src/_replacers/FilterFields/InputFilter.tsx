import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { searchByTagName } from '@/_utilities/searchFnUtils';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  template: ReactElement;
  label?: string;
  inputProps?: {
    [key: string]: string | boolean | number;
  };
  value: string | number | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function InputFilter({ template, label, inputProps, value, handleChange }: Props) {
  const matches: tMatch[] = [
    { searchFn: searchByPartOfClass(['field-label']), transformChild: child => cloneElement(child, {}, label ? [label] : child.props.children) },
    {
      searchFn: searchByTagName('input'),
      transformChild: child =>
        cloneElement(child, {
          ...(inputProps ?? {}),
          value,
          onChange: handleChange,
        }),
    },
  ];

  return transformMatchingElements(template, matches) as ReactElement;
}
