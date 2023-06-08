import React, { cloneElement, useState } from 'react';

import { TabContentProps } from '@/_typings/agent-my-listings';
import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';

import Checkbox from '@/_replacers/FilterFields/CheckBox';
import ChipsWithLabel from '@/_replacers/FilterFields/ChipsWithLabel';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';

import useFormEvent, { Events, getValueByKey, PrivateListingData, setMultiSelectValue } from '@/hooks/useFormEvent';

export default function TabStrata({ template, nextStepClick, attributes, initialState }: TabContentProps) {
  const { amenities } = attributes;
  const [templates] = useState(
    captureMatchingElements(template, [
      { elementName: 'input', searchFn: searchByPartOfClass(['f-field-wrapper']) },
      { elementName: 'checkbox', searchFn: searchByPartOfClass(['checkbox-wrap']) },
      { elementName: 'chipsWithLabel', searchFn: searchByPartOfClass(['chips-fieldset']) },
    ]),
  );

  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, initialState);
  const selectedChips = getValueByKey('building_amenities', data);

  const inputs = [
    {
      label: 'Building Bylaws',
      inputProps: { name: 'building_bylaws' },
    },
    {
      label: 'Maintenance Fee',
      inputProps: { name: 'maintenance_fee' },
    },
    {
      label: 'Restrictions',
      inputProps: { name: 'restrictions' },
    },
    {
      label: 'Age Restriction',
      inputProps: { name: 'age_restriction' },
    },
    {
      label: 'Dogs',
      inputProps: { name: 'dogs' },
    },
    {
      label: 'Cats',
      inputProps: { name: 'cats' },
    },
    {
      label: 'Total Pets Allowed',
      inputProps: { name: 'total_pets_allowed' },
    },
    {
      label: 'Total Rentals Allowed',
      inputProps: { name: 'total_rentals_allowed' },
    },
    {
      label: 'Complex Name',
      inputProps: { name: 'complex_name' },
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
                handleChange={e => fireEvent({ [field.inputProps.name]: e.currentTarget.value })}
              />
            );
          }),
          <ChipsWithLabel
            key={`chipsList-1`}
            label='Building Amenities'
            template={templates.chipsWithLabel}
            values={selectedChips}
            handleSelect={val => {
              const newValue = setMultiSelectValue(val, selectedChips ? selectedChips : []);
              fireEvent({ building_amenities: newValue });
            }}
            chipsList={amenities}
          />,

          <div key={'containerrrrr'} className='flex gap-4 col-span-2'>
            <div className=' w-5/12 flex-shrink'>
              <Checkbox
                key={'checkbox-1'}
                isPicked={!!data?.locked}
                template={templates.checkbox}
                item={{ title: 'Locker' }}
                handleCheckList={() => fireEvent({ locked: !data?.locked })}
              />
            </div>

            <div className=' w-6/12 flex-shrink-0 flex-grow'>
              <Checkbox
                key={'checkbox-2'}
                isPicked={!!data?.council_approval_required}
                template={templates.checkbox}
                item={{ title: 'Council Approval Required' }}
                handleCheckList={() => fireEvent({ council_approval_required: !data?.council_approval_required })}
              />
            </div>
          </div>,
        ]);
      },
    },
    {
      searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']),
      transformChild: child => cloneElement(child, { onClick: nextStepClick }),
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}