import React, { cloneElement, useState } from 'react';

import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';

import ChipsWithLabel from '@/_replacers/FilterFields/ChipsWithLabel';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import SelectWithLabel from '@/_replacers/FilterFields/SelectWithLabel';

import useFormEvent, { Events, PrivateListingData, getValueByKey, setMultiSelectValue } from '@/hooks/useFormEvent';

export default function TabSummary({ template, nextStepClick, attributes, initialState }: TabContentProps) {
  const { building_styles, connected_services, amenities, types } = attributes || {};

  const [templates] = useState(
    captureMatchingElements(template, [
      { elementName: 'selectInput', searchFn: searchByPartOfClass(['select-input']) },
      { elementName: 'input', searchFn: searchByPartOfClass(['text-input']) },
      { elementName: 'chipsWithLabel', searchFn: searchByPartOfClass(['chips-fieldset']) },
    ]),
  );

  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, initialState);
  console.log(data);
  const summaryFields = [
    {
      label: 'Property Type',
      inputProps: {
        placeholder: 'Choose Property Type',
        values: types,
        name: 'dwelling_type',
      },
      template: templates.selectInput,
      generatedPrompt: 'dwelling_type',
    },
    {
      label: 'Asking Price',
      inputProps: {
        placeholder: 'Asking Price',
        name: 'asking_price',
        type: 'number',
        min: 0,
      },
      template: templates.input,
      generatedPrompt: '',
    },
    {
      label: 'Building Style',
      inputProps: {
        placeholder: 'Choose Building Style',
        values: building_styles,
        name: 'building_style',
      },
      template: templates.selectInput,
      generatedPrompt: '',
    },
    {
      label: 'Year Built',
      inputProps: {
        placeholder: 'Year Built',
        name: 'year_built',
        type: 'number',
        min: 0,
      },
      template: templates.input,
      generatedPrompt: '',
    },
    {
      label: '??? Property Disclosure',
      inputProps: {
        placeholder: 'Property Disclosure',
        name: 'property_disclosure',
      },
      template: templates.input,
      generatedPrompt: '',
    },
    {
      label: 'Property Tax Amount',
      inputProps: {
        placeholder: '$1,000',
        name: 'gross_taxes',
        type: 'number',
        min: 0,
      },
      template: templates.input,
      generatedPrompt: '',
    },
    {
      label: 'For Tax Year',
      inputProps: {
        placeholder: '2021',
        name: 'tax_year',
        type: 'number',
        min: 0,
      },
      template: templates.input,
      generatedPrompt: '',
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
    },
    {
      label: 'Utilities',
      inputProps: {
        name: 'connected_services',
        list: connected_services,
      },
      template: templates.chipsWithLabel,
    },
  ];

  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['virtual-tours-inputs']),
      transformChild: child => {
        return cloneElement(child, {}, [
          ...summaryFields.map(field => {
            const isInput = !field.inputProps.values;
            const value = getValueByKey(field.inputProps.name, data);
            const values = field.inputProps.values ?? [];
            const strapiData = data?.strapi ? getValueByKey('strapi', data as object) : null;
            const valueStrapi = strapiData && strapiData[field.generatedPrompt] ? getValueByKey(field.generatedPrompt, strapiData) : null;
            const valueSelect = (value && value.id) || !valueStrapi ? value : { name: valueStrapi.name, id: valueStrapi.id };

            return isInput ? (
              <InputWithLabel
                key={field.inputProps.name}
                template={field.template}
                inputProps={field.inputProps ?? {}}
                value={value}
                label={field.label}
                handleChange={e => {
                  const newValue = field?.inputProps.type === 'number' ? parseInt(e.currentTarget.value) : e.currentTarget.value;
                  fireEvent({ [field.inputProps.name]: newValue });
                }}
              />
            ) : (
              <SelectWithLabel
                key={field.inputProps.name}
                template={field.template}
                values={values}
                label={field.label}
                placeholder={field.inputProps.placeholder}
                selectedValue={valueSelect}
                handleSelect={val => fireEvent({ [field.inputProps.name]: val })}
              />
            );
          }),
          ...chipFields.map(field => {
            const value = getValueByKey(field.inputProps.name, data);

            return (
              <ChipsWithLabel
                key={field.inputProps.name}
                label={field.label}
                template={field.template}
                values={value ?? []}
                handleSelect={val => {
                  const newValue = setMultiSelectValue(val, value ? value : []);
                  fireEvent({ [field.inputProps.name]: newValue });
                }}
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
