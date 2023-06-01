import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import ChipsList from '@/_replacers/FilterFields/ChipList';
import ChipsWithLabel from '@/_replacers/FilterFields/ChipsWithLabel';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import SelectWithLabel from '@/_replacers/FilterFields/SelectWithLabel';

import { TabContentProps } from '@/_typings/agent-my-listings';
import { DwellingType } from '@/_typings/property';
import { ValueInterface } from '@/_typings/ui-types';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { cloneElement, useState } from 'react';

type Props = {};

export default function TabSummary({ template, nextStepClick, attributes }: TabContentProps) {
  const { building_styles, connected_services, amenities, types } = attributes || {};
  const [templates] = useState(
    captureMatchingElements(template, [
      { elementName: 'selectInput', searchFn: searchByPartOfClass(['select-input']) },
      { elementName: 'input', searchFn: searchByPartOfClass(['text-input']) },
      { elementName: 'chipsWithLabel', searchFn: searchByPartOfClass(['chips-fieldset']) },
    ]),
  );
  // state and handleSelectValue are just for demo purpose only
  const [selectedValue, setSelectedValue] = useState<ValueInterface | null>(null);
  const handleSelectValue = (value: ValueInterface) => {
    setSelectedValue(value);
  };
  /// value and handleChange are for demo purpose
  const [value, setValue] = useState();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };
  const [selectedChips, setSelectedChips] = useState<ValueInterface[]>([]);
  const handleSelect = (value: ValueInterface) => {
    const isIn = selectedChips?.some((item: ValueInterface) => item.value === value.value);
    const newArr = isIn ? selectedChips?.filter((item: ValueInterface) => item.value !== value.value) : [...(selectedChips ?? []), value];
    setSelectedChips([...newArr]);
  };
  const values = [
    { label: 'House', value: 'house' },
    { label: 'Condo', value: 'condo' },
  ];
  const summaryInputElements = [
    <SelectWithLabel
      key={0}
      template={templates.selectInput}
      values={types}
      label='Property Type'
      placeholder='Choose Property Type'
      selectedValue={selectedValue}
      handleSelect={handleSelectValue}
    />,
    <InputWithLabel
      key={1}
      template={templates.input}
      inputProps={{
        placeholder: 'Asking Price',
      }}
      value={value}
      handleChange={handleChange}
    />,

    <SelectWithLabel
      key={2}
      template={templates.selectInput}
      values={building_styles}
      label='Building Style'
      placeholder='Choose Building Style'
      selectedValue={selectedValue}
      handleSelect={handleSelectValue}
    />,
    // <SelectWithLabel    DON"T HAVE ATTRIBUTES FOR IT
    //   key={3}
    //   template={templates.selectInput}
    //   values={values}
    //   label='Title to Land'
    //   placeholder='Choose Title to Land'
    //   selectedValue={selectedValue}
    //   handleSelect={handleSelectValue}
    // />,
  ];
  const textFields = [
    {
      label: 'Year Built',
      inputProps: {
        placeholder: 'Year Built',
        name: 'built_year',
      },
    },
    {
      label: '??? Property Disclosure',
      inputProps: {
        placeholder: 'Property Disclosure',
      },
    },
    {
      label: 'Property Tax Amount',
      inputProps: {
        placeholder: '$1,000',
      },
    },
    {
      label: 'For Tax Year',
      inputProps: {
        placeholder: '2021',
      },
    },
  ];
  const amenitiesDemo = [
    { label: 'House', value: DwellingType.HOUSE },
    { label: 'Apartment/Condo', value: DwellingType.APARTMENT_CONDO },
    { label: 'Townhouse', value: DwellingType.TOWNHOUSE },
    { label: 'Duplex +', value: DwellingType.DUPLEX },
    { label: 'Row House (Non-Strata)', value: DwellingType.ROW_HOUSE },
    { label: 'Manufactured', value: DwellingType.MANUFACTURED },
    { label: 'Other', value: DwellingType.OTHER },
  ];
  const chipsItems = [
    <ChipsWithLabel
      key={`chipsList-1`}
      label='Amenities'
      template={templates.chipsWithLabel}
      values={selectedChips}
      handleSelect={handleSelect}
      chipsList={amenities}
    />,
    <ChipsWithLabel
      key={`chipsList-2`}
      label='Utilities'
      template={templates.chipsWithLabel}
      values={selectedChips}
      handleSelect={handleSelect}
      chipsList={connected_services}
    />,
  ];
  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['virtual-tours-inputs']),
      transformChild: child => {
        return cloneElement(
          child,
          {},

          [
            ...summaryInputElements,
            ...textFields.map((field, i) => (
              <InputWithLabel
                key={i + 3}
                inputProps={field.inputProps ?? {}}
                label={field.label}
                template={templates.input}
                value={value}
                handleChange={handleChange}
              />
            )),
            ...chipsItems,
          ],
        );
      },
    },
    { searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']), transformChild: child => cloneElement(child, { onClick: nextStepClick }) },
  ];
  // return template;
  return <>{transformMatchingElements(template, matches)}</>;
}
