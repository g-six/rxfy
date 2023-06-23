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
  const half_baths = data?.half_baths ?? 0;
  const baths = data?.baths ?? 0;
  const full_baths = parseInt(baths.toString()) - parseInt(half_baths.toString());

  const sizesElements = [
    {
      Component: InputWithSelect,
      props: {
        template: templates.mixedSelectInput,
        label: 'Living Area',
        inputElementProps: {
          value: data?.floor_area_total ?? '',
          handleChange: (e: React.ChangeEvent<HTMLInputElement>) => fireEvent({ floor_area_total: parseInt(e.currentTarget.value) }),
          inputProps: {
            name: 'floor_area_total',
            placeholder: 'Living Area',
            type: 'number',
            min: 0,
          },
        },
        selectProps: {
          values: [
            { id: 'sqft', name: 'Sqft' },
            { id: 'sqm', name: 'SqM' },
          ] satisfies ValueInterface[],
          placeholder: 'units',
          selectedValue: data?.floor_area_uom,
          handleSelect: (val: ValueInterface) => fireEvent({ floor_area_uom: val.id as string }),
        },
      },
    },
    {
      Component: InputWithSelect,
      props: {
        template: templates.mixedSelectInput,
        label: 'Total Lot Size',
        inputElementProps: {
          value: data?.lot_area ?? '',
          handleChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            fireEvent({ lot_area: parseInt(e.currentTarget.value) });
          },
          inputProps: {
            placeholder: 'Total Lot Size',
            type: 'number',
            min: 0,
          },
        },
        selectProps: {
          values: [
            { id: 'sqft', name: 'Sqft' },
            { id: 'sqm', name: 'SqM' },
          ] satisfies ValueInterface[],
          placeholder: 'units',
          selectedValue: data?.lot_uom,
          handleSelect: (val: ValueInterface) => {
            fireEvent({ lot_uom: val.id as string });
          },
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
        type: 'number',
        min: 0,
      },
      generatedPrompt: 'beds',
    },
    {
      label: 'Total Bathrooms',
      inputProps: {
        placeholder: '# of Bathrooms (Total)',
        name: 'baths',
        type: 'number',
        min: 0,
      },
      generatedPrompt: 'baths',
    },
    {
      label: '# of Full Baths',
      inputProps: {
        placeholder: '# of Full Baths',
        name: 'full_baths',
        type: 'number',
        min: 0,
        disabled: true,
        value: full_baths > 0 ? full_baths : 0,
      },
      generatedPrompt: '',
    },
    {
      label: '# of Half Baths',
      inputProps: {
        placeholder: '# of Half Baths',
        name: 'half_baths',
        type: 'number',
        min: 0,
      },
      generatedPrompt: '',
    },
    {
      label: '# of Kitchens',
      inputProps: {
        placeholder: '# of Kitchens',
        name: 'kitchens',
        type: 'number',
        min: 0,
      },
      generatedPrompt: 'kitchens',
    },
    {
      label: '# of Additional Rooms',
      inputProps: {
        placeholder: '# of Additional Rooms',
        name: 'additional_rooms',
        type: 'number',
        min: 0,
      },
      generatedPrompt: '',
    },
    {
      label: '# of Garage',
      inputProps: {
        placeholder: '# of Garage',
        name: 'garage',
        type: 'number',
        min: 0,
      },
      generatedPrompt: 'garages',
    },
  ];
  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['virtual-tours-inputs']),
      transformChild: child => {
        return cloneElement(child, {}, [
          ...sizesElements.map(({ Component, props }, i) => <Component key={i} {...props} />),
          ...textFields.map((field, i) => {
            const value = getValueByKey(field.inputProps.name, data);
            const valueAlternative = data?.generatedPrompt ? getValueByKey(field.generatedPrompt, data.generatedPrompt as object) : null;
            if (valueAlternative && (value === undefined || value === null)) {
              fireEvent({ [field.inputProps.name]: valueAlternative, full_baths: full_baths });
            } else if (data && data.full_baths !== full_baths) {
              fireEvent({ full_baths: full_baths });
            }
            return (
              <InputWithLabel
                key={`${field.label}_${i}`}
                inputProps={field.inputProps ?? {}}
                label={field.label}
                template={templates.input}
                value={(field.inputProps?.value ? field.inputProps.value : value) ?? ''}
                handleChange={e =>
                  fireEvent({
                    [field.inputProps.name]: parseInt(e.currentTarget.value),
                    full_baths: full_baths,
                  })
                }
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
  return <>{transformMatchingElements(template, matches)}</>;
}
