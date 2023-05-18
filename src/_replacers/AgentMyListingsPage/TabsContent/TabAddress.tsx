import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import InputFilter from '@/_replacers/FilterFields/InputFilter';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { cloneElement, useState } from 'react';

export default function TabAddress({ template, nextStepClick }: TabContentProps) {
  const [templates] = useState(captureMatchingElements(template, [{ elementName: 'input', searchFn: searchByPartOfClass(['f-field-wrapper']) }]));
  const addressFields = [
    {
      label: 'Address',
    },
    {
      label: 'Unit',
    },
    {
      label: 'City',
    },
    {
      label: 'Provinance / State',
    },
    {
      label: 'Postal Code / ZIP Code',
    },
    {
      label: 'Neighbourhood',
      inputProps: {
        placeholder: 'some placeholder',
        name: 'neighbourhood',
      },
    },
  ];
  const [value, setValue] = useState('');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.name);
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['virtual-tours-inputs']),
      transformChild: child => {
        return cloneElement(
          child,
          {},

          addressFields.map((field, i) => (
            <InputFilter key={i} inputProps={field.inputProps ?? {}} label={field.label} template={templates.input} value={value} handleChange={handleChange} />
          )),
        );
      },
    },
    { searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']), transformChild: child => cloneElement(child, { onClick: nextStepClick }) },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
