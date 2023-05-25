import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { InputPropsInterface, SelectPropsInterface, ValueInterface } from '@/_typings/ui-types';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import RxSelect from '@/components/RxForms/RxSelect';
import React, { ReactElement, cloneElement } from 'react';
import Input from './Input';

type Props = {
  template: ReactElement;
  label?: string;
  //----Input PASSED THROUGH PROPS ----
  inputElementProps: {
    value: string | number | undefined;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputProps?: InputPropsInterface;
  };
  // ----RXSELECT PASSED THROUGH PROPS ----
  selectProps: SelectPropsInterface;
};

//mixed input field with sconnected select to it
export default function InputWithSelect({ template, label, inputElementProps, selectProps }: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['f-field-label']),
      transformChild: child => {
        return label ? cloneElement(child, {}, [label]) : child;
      },
    },
    {
      searchFn: searchByPartOfClass(['w-input']),
      transformChild: child => {
        return <Input template={child} value={inputElementProps?.value} onChange={inputElementProps.handleChange} inputProps={inputElementProps.inputProps} />;
      },
    },

    {
      searchFn: searchByClasses(['w-dropdown']),
      transformChild: child => {
        return <RxSelect wrapperNode={child} menuClassNames={['w-dropdown-list']} toggleClassNames={['w-dropdown-toggle']} {...selectProps} />;
      },
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
