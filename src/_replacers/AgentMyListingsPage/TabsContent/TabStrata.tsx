import React, { cloneElement, useState } from 'react';

import { TabContentProps } from '@/_typings/agent-my-listings';
import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';

import Checkbox from '@/_replacers/FilterFields/CheckBox';
import ChipsWithLabel from '@/_replacers/FilterFields/ChipsWithLabel';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';

import { PrivateListingData, getValueByKey, setMultiSelectValue } from '@/hooks/useFormEvent';

export default function TabStrata({ template, nextStepClick, attributes, data, fireEvent }: TabContentProps) {
  const { amenities } = attributes;
  const [templates] = useState(
    captureMatchingElements(template, [
      { elementName: 'input', searchFn: searchByPartOfClass(['f-field-wrapper']) },
      { elementName: 'checkbox', searchFn: searchByPartOfClass(['checkbox-wrap']) },
      { elementName: 'chipsWithLabel', searchFn: searchByPartOfClass(['chips-fieldset']) },
    ]),
  );

  const selectedChips = getValueByKey('amenities', data);

  const inputs = [
    {
      label: 'Building Bylaws',
      inputProps: { name: 'building_bylaws' },
    },
    {
      label: 'Maintenance Fee',
      inputProps: {
        name: 'strata_fee',
        type: 'number',
        min: 0,
      },
    },
    {
      label: 'Restrictions',
      inputProps: { name: 'restrictions' },
    },
    {
      label: 'Age Restriction',
      inputProps: {
        name: 'minimum_age_restriction',
        type: 'number',
        placeholder: 'Minimum Age',
        min: 0,
      },
    },
    {
      label: 'Dogs',
      inputProps: {
        name: 'total_dogs_allowed',
        type: 'number',
        min: 0,
      },
    },
    {
      label: 'Cats',
      inputProps: {
        name: 'total_cats_allowed',
        type: 'number',
        min: 0,
      },
    },
    {
      label: 'Total Pets Allowed',
      inputProps: {
        name: 'total_pets_allowed',
        type: 'number',
        min: 0,
      },
    },
    {
      label: 'Total Rentals Allowed',
      inputProps: {
        name: 'total_allowed_rentals',
        type: 'number',
        min: 0,
      },
    },
    {
      label: 'Complex Name',
      inputProps: { name: 'complex_compound_name' },
    },
  ];

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['virtual-tours-inputs']),
      transformChild: child => {
        return cloneElement(child, {}, [
          ...inputs.map(field => {
            const val = getValueByKey(field.inputProps.name, data);
            return (
              <InputWithLabel
                key={field.inputProps.name}
                inputProps={field.inputProps ?? {}}
                label={field.label}
                template={templates.input}
                value={val}
                handleChange={e => {
                  const newValue = field?.inputProps.type === 'number' ? parseInt(e.currentTarget.value) : e.currentTarget.value;

                  fireEvent({ [field.inputProps.name]: newValue });
                }}
              />
            );
          }),
          <Checkbox
            key={'checkbox-2'}
            isPicked={!!data?.council_approval_required}
            template={templates.checkbox}
            item={{ title: 'Council Approval Required' }}
            handleCheckList={() => fireEvent({ council_approval_required: !data?.council_approval_required })}
          />,
          <ChipsWithLabel
            key={`chipsList-1`}
            label='Building Amenities'
            template={templates.chipsWithLabel}
            values={selectedChips}
            handleSelect={val => {
              const newValue = setMultiSelectValue(val, selectedChips ? selectedChips : []);
              fireEvent({ amenities: newValue });
            }}
            chipsList={amenities}
          />,
        ]);
      },
    },
    {
      searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']),
      transformChild: child =>
        cloneElement(child, {
          onClick: () => {
            const {
              building_bylaws,
              strata_fee,
              restrictions,
              total_dogs_allowed,
              total_cats_allowed,
              total_pets_allowed,
              total_allowed_rentals,
              complex_compound_name,
            } = data;
            const { amenities } = data as unknown as { amenities: { id: number }[]; connected_services: { id: number }[] };
            nextStepClick(undefined, {
              amenities: amenities.map(({ id }) => id),
              building_bylaws,
              strata_fee,
              restrictions,
              total_dogs_allowed,
              total_cats_allowed,
              total_pets_allowed,
              total_allowed_rentals,
              complex_compound_name,
            } as unknown as PrivateListingData);
          },
        }),
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
