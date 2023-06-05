import React, { cloneElement, useState } from 'react';

import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';

export default function TabAddress({ template, nextStepClick }: TabContentProps) {
  const [templates] = useState(captureMatchingElements(template, [{ elementName: 'input', searchFn: searchByPartOfClass(['f-field-wrapper']) }]));
  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  console.log('data', data);

  const addressFields = [
    {
      label: 'Address',
      inputProps: {
        placeholder: 'Address',
        name: 'address_string',
      },
      generatedAddress: 'address',
    },
    {
      label: 'Unit',
      inputProps: {
        name: 'unit',
      },
      generatedAddress: '',
    },
    {
      label: 'City',
      inputProps: {
        name: 'city',
      },
      generatedAddress: 'city',
    },
    {
      label: 'Provinance / State',
      inputProps: {
        name: 'state',
      },
      generatedAddress: 'state_province',
    },
    {
      label: 'Postal Code / ZIP Code',
      inputProps: {
        name: 'zip',
      },
      generatedAddress: '',
    },
    {
      label: 'Neighbourhood',
      inputProps: {
        placeholder: 'Neighbourhood',
        name: 'neighbourhood',
      },
      generatedAddress: '',
    },
  ];
  /// value and handleChange are for demo purpose
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['virtual-tours-inputs']),
      transformChild: child => {
        return cloneElement(
          child,
          {},
          addressFields.map(field => {
            const obj = data as unknown as object;
            const keyIndex = Object.keys(obj).reduce((foundIndex, k, i) => {
              return k === field.inputProps.name ? i + 1 : foundIndex;
            }, 0);
            const value = keyIndex ? Object.values(data as object)[keyIndex - 1].toString() : '';

            const keyAlternative = field.generatedAddress.toString();
            const keyAlternativeIndex = Object.keys(obj).reduce((foundIndex, k, i) => {
              return k === keyAlternative ? i + 1 : foundIndex;
            }, 0);
            const valueAlternative = keyAlternativeIndex ? Object.values(data as object)[keyAlternativeIndex - 1].toString() : null;
            return (
              <InputWithLabel
                key={field.inputProps.name}
                inputProps={field.inputProps ?? {}}
                label={field.label}
                template={templates.input}
                value={value ? value : valueAlternative === null ? value : ''}
                handleChange={e =>
                  fireEvent({
                    [field.inputProps.name]: e.currentTarget.value,
                  })
                }
              />
            );
          }),
        );
      },
    },
    { searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']), transformChild: child => cloneElement(child, { onClick: nextStepClick }) },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
