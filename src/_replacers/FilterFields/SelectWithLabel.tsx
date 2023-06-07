import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { ValueInterface } from '@/_typings/ui-types';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import RxSelect from '@/components/RxForms/RxSelect';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  template: ReactElement;
  label?: string;
  // ---- PASSED THROUGH PROPS ----
  values: ValueInterface[];
  selectedValue: ValueInterface | null;
  handleSelect: (value: ValueInterface) => void;
  placeholder?: string;
};

export default function SelectWithLabel({ template, label, ...passedThroughProps }: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['f-field-label']),
      transformChild: child => {
        return label ? cloneElement(child, {}, [label]) : child;
      },
    },
    {
      searchFn: searchByClasses(['w-dropdown']),
      transformChild: child => {
        return <RxSelect wrapperNode={child} menuClassNames={['w-dropdown-list']} toggleClassNames={['w-dropdown-toggle']} {...passedThroughProps} />;
      },
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
