import React, { cloneElement, useState } from 'react';

import { TabContentProps } from '@/_typings/agent-my-listings';
import { ValueInterface } from '@/_typings/ui-types';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';

import ChipsWithLabel from '@/_replacers/FilterFields/ChipsWithLabel';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import SelectWithLabel from '@/_replacers/FilterFields/SelectWithLabel';

import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';

export default function TabSummary({ template, nextStepClick, attributes }: TabContentProps) {
  const { building_styles, connected_services, amenities, types } = attributes || {};
  const [templates] = useState(
    captureMatchingElements(template, [
      { elementName: 'selectInput', searchFn: searchByPartOfClass(['select-input']) },
      { elementName: 'input', searchFn: searchByPartOfClass(['text-input']) },
      { elementName: 'chipsWithLabel', searchFn: searchByPartOfClass(['chips-fieldset']) },
    ]),
  );
  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  // state and handleSelectValue are just for demo purpose only
  const [selectedValue, setSelectedValue] = useState<ValueInterface | null>(null);
  const handleSelectValue = (value: ValueInterface) => {
    setSelectedValue(value);
  };

  /// value and handleChange are for demo purpose
  const [value, setValue] = useState();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {};
  const [selectedChips, setSelectedChips] = useState<ValueInterface[]>([]);
  const handleSelect = (value: ValueInterface) => {
    const isIn = selectedChips?.some((item: ValueInterface) => item.value === value.value);
    const newArr = isIn ? selectedChips?.filter((item: ValueInterface) => item.value !== value.value) : [...(selectedChips ?? []), value];
    setSelectedChips([...newArr]);
  };

  const summaryFields = [
    {
      label: 'Property Type',
      inputProps: {
        placeholder: 'Choose Property Type',
        values: types,
        name: 'property_type',
      },
      template: templates.selectInput,
      onChange: handleSelectValue,
    },
    {
      label: 'Asking Price',
      inputProps: {
        placeholder: 'Asking Price',
        name: 'asking_price',
      },
      template: templates.input,
      onChange: handleChange,
    },
    {
      label: 'Building Style',
      inputProps: {
        placeholder: 'Choose Building Style',
        values: building_styles,
        name: 'building_style',
      },
      template: templates.selectInput,
      onChange: handleSelectValue,
    },
    {
      label: 'Year Built',
      inputProps: {
        placeholder: 'Year Built',
        name: 'built_year',
      },
      template: templates.input,
      onChange: handleChange,
    },
    {
      label: '??? Property Disclosure',
      inputProps: {
        placeholder: 'Property Disclosure',
        name: 'property_disclosure',
      },
      template: templates.input,
      onChange: handleChange,
    },
    {
      label: 'Property Tax Amount',
      inputProps: {
        placeholder: '$1,000',
        name: 'property_tax',
      },
      template: templates.input,
      onChange: handleChange,
    },
    {
      label: 'For Tax Year',
      inputProps: {
        placeholder: '2021',
        name: 'tax_year',
      },
      template: templates.input,
      onChange: handleChange,
    },
  ];

  const chipFields = [
    {
      label: 'Amenities',
      inputProps: {
        name: 'amenities',
        list: amenities,
      },
      template: templates.chipsWithLabel,
      onChange: handleSelect,
    },
    {
      label: 'Utilities',
      inputProps: {
        name: 'utilities',
        list: connected_services,
      },
      template: templates.chipsWithLabel,
      onChange: handleSelect,
    },
  ];

  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['virtual-tours-inputs']),
      transformChild: child => {
        return cloneElement(child, {}, [
          ...summaryFields.map(field => {
            const isInput = !field.inputProps.values;
            const handleChangeInput = field.onChange as (e: React.ChangeEvent<HTMLInputElement>) => void;
            const handleChangeSelect = field.onChange as (value: ValueInterface) => void;
            return isInput ? (
              <InputWithLabel
                key={field.inputProps.name}
                template={field.template}
                inputProps={{
                  placeholder: field.inputProps.placeholder,
                }}
                value={value}
                label={field.label}
                handleChange={handleChangeInput}
              />
            ) : (
              <SelectWithLabel
                key={field.inputProps.name}
                template={field.template}
                values={field.inputProps.values as ValueInterface[]}
                label={field.label}
                placeholder={field.inputProps.placeholder}
                selectedValue={selectedValue}
                handleSelect={handleChangeSelect}
              />
            );
          }),
          ...chipFields.map(field => {
            return (
              <ChipsWithLabel
                key={field.inputProps.name}
                label={field.label}
                template={field.template}
                values={selectedChips}
                handleSelect={field.onChange}
                chipsList={field.inputProps.list}
              />
            );
          }),
        ]);
      },
    },
    {
      searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']),
      transformChild: child => cloneElement(child, { onClick: nextStepClick }),
    },
  ];
  // return template;
  return <>{transformMatchingElements(template, matches)}</>;
}
