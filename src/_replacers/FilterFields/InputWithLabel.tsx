import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { InputPropsInterface } from '@/_typings/ui-types';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { searchByTagName } from '@/_utilities/searchFnUtils';
import React, { ReactElement, cloneElement } from 'react';
import Input from './Input';

type Props = {
  template: ReactElement;
  label?: string;
  value: string | number | undefined;
  inputProps?: InputPropsInterface;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function InputWithLabel({ template, label, inputProps, value, handleChange }: Props) {
  const matches: tMatch[] = [
    { searchFn: searchByPartOfClass(['field-label']), transformChild: child => cloneElement(child, {}, label ? [label] : child.props.children) },
    {
      searchFn: searchByTagName('input'),
      transformChild: child => {
        return <Input key={1} template={child} value={value} onChange={handleChange} inputProps={inputProps} />;
      },
    },
  ];

  return transformMatchingElements(template, matches) as ReactElement;
}
