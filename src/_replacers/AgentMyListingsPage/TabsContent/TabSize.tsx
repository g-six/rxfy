import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import InputWithSelect from '@/_replacers/FilterFields/InputWithSelect';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { ValueInterface } from '@/_typings/ui-types';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { cloneElement, useState } from 'react';

export default function TabSize({ template, nextStepClick }: TabContentProps) {
  const [templates] = useState(
    captureMatchingElements(template, [
      { elementName: 'mixedSelectInput', searchFn: searchByPartOfClass(['mixed-select-input']) },
      { elementName: 'input', searchFn: searchByPartOfClass(['text-input']) },
    ]),
  );
  /// value and handleChange are for demo purpose
  const [value, setValue] = useState();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.name);
  };
  // state and handleSelectValue are just for demo purpose only
  const [selectedValue, setSelectedValue] = useState<ValueInterface | null>({ value: 'sqft', label: 'sqft' });
  const handleSelectValue = (value: ValueInterface) => {
    setSelectedValue(value);
  };
  const sizesElements = [
    {
      Component: InputWithSelect,
      props: {
        template: templates.mixedSelectInput,
        label: 'Living Area',
        inputElementProps: {
          value,
          handleChange,
          inputProps: {
            placeholder: 'Living Area',
          },
        },
        selectProps: {
          values: [
            { value: 'sqft', label: 'Sqft' },
            { value: 'sqm', label: 'SqM' },
          ],

          placeholder: 'Choose Building Style',
          selectedValue: selectedValue,
          handleSelect: handleSelectValue,
        },
      },
    },
    {
      Component: InputWithSelect,
      props: {
        template: templates.mixedSelectInput,
        label: 'Total Lot Size',
        inputElementProps: {
          value,
          handleChange,
          inputProps: {
            placeholder: 'Total Lot Size',
          },
        },
        selectProps: {
          values: [
            { value: 'sqft', label: 'Sqft' },
            { value: 'sqm', label: 'SqM' },
          ],

          placeholder: 'Choose Building Style',
          selectedValue: selectedValue,
          handleSelect: handleSelectValue,
        },
      },
    },
  ];
  const textFields = [
    {
      label: 'Total Bedrooms',
      inputProps: {
        placeholder: '# of Bedrooms (Total)',
        name: 'beds',
      },
    },
    {
      label: 'Total Bathrooms',
      inputProps: {
        placeholder: '# of Bathrooms (Total)',
        name: 'baths',
      },
    },
    {
      label: '# of Full Baths',
      inputProps: {
        placeholder: '# of Full Baths',
        name: 'baths-full',
      },
    },
    {
      label: '# of Half Baths',
      inputProps: {
        placeholder: '# of Half Baths',
        name: 'baths-half',
      },
    },
    {
      label: '# of Kitchens',
      inputProps: {
        placeholder: '# of Kitchens',
        name: 'kitchens',
      },
    },
    {
      label: '# of Additional Rooms',
      inputProps: {
        placeholder: '# of Additional Rooms',
        name: 'additional-rooms',
      },
    },
    {
      label: '# of Garage',
      inputProps: {
        placeholder: '# of Garage',
        name: 'garage',
      },
    },
  ];
  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['virtual-tours-inputs']),
      transformChild: child => {
        return cloneElement(
          child,
          {},

          [
            ...sizesElements.map(({ Component, props }, i) => <Component key={i} {...props} />),
            ...textFields.map((field, i) => (
              <InputWithLabel
                key={`${field.label}_${i}`}
                inputProps={field.inputProps ?? {}}
                label={field.label}
                template={templates.input}
                value={value}
                handleChange={handleChange}
              />
            )),
          ],
        );
      },
    },
    { searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']), transformChild: child => cloneElement(child, { onClick: nextStepClick }) },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
