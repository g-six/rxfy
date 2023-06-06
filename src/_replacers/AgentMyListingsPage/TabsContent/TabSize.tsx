import React, { cloneElement, useState } from 'react';

import { ValueInterface } from '@/_typings/ui-types';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';

import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import InputWithSelect from '@/_replacers/FilterFields/InputWithSelect';

import useFormEvent, { Events, PrivateListingData, getValueByKey } from '@/hooks/useFormEvent';

export default function TabSize({ template, nextStepClick, initialState }: TabContentProps) {
  const [templates] = useState(
    captureMatchingElements(template, [
      { elementName: 'mixedSelectInput', searchFn: searchByPartOfClass(['mixed-select-input']) },
      { elementName: 'input', searchFn: searchByPartOfClass(['text-input']) },
    ]),
  );

  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, initialState);

  const sizesElements = [
    {
      Component: InputWithSelect,
      props: {
        template: templates.mixedSelectInput,
        label: 'Living Area',
        inputElementProps: {
          value: data?.living_area ?? '',
          handleChange: (e: React.ChangeEvent<HTMLInputElement>) => fireEvent({ living_area: e.currentTarget.value }),
          inputProps: { placeholder: 'Living Area' },
        },
        selectProps: {
          values: [
            { value: 'sqft', label: 'Sqft' },
            { value: 'sqm', label: 'SqM' },
          ],
          placeholder: 'units',
          selectedValue: data?.living_area_units,
          handleSelect: (val: ValueInterface) => fireEvent({ living_area_units: val }),
        },
      },
    },
    {
      Component: InputWithSelect,
      props: {
        template: templates.mixedSelectInput,
        label: 'Total Lot Size',
        inputElementProps: {
          value: data?.total_size ?? '',
          handleChange: (e: React.ChangeEvent<HTMLInputElement>) => fireEvent({ total_size: e.currentTarget.value }),
          inputProps: { placeholder: 'Total Lot Size' },
        },
        selectProps: {
          values: [
            { value: 'sqft', label: 'Sqft' },
            { value: 'sqm', label: 'SqM' },
          ],

          placeholder: 'units',
          selectedValue: data?.total_size_units,
          handleSelect: (val: ValueInterface) => fireEvent({ total_size_units: val }),
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
        name: 'baths_full',
      },
    },
    {
      label: '# of Half Baths',
      inputProps: {
        placeholder: '# of Half Baths',
        name: 'baths_half',
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
        name: 'additional_rooms',
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
                value={getValueByKey(field.inputProps.name, data)}
                handleChange={e => fireEvent({ [field.inputProps.name]: e.currentTarget.value })}
              />
            )),
          ],
        );
      },
    },
    {
      searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']),
      transformChild: child => cloneElement(child, { onClick: nextStepClick }),
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
