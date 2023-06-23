import React, { cloneElement, createElement, useState } from 'react';

import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { captureMatchingElements, removeKeys, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import useFormEvent, { Events, PrivateListingData, getValueByKey } from '@/hooks/useFormEvent';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import MapsTabs from './MapsTabs';

export default function TabAddress({ template, nextStepClick, initialState, saveAndExit }: TabContentProps) {
  const [templates] = useState(captureMatchingElements(template, [{ elementName: 'input', searchFn: searchByPartOfClass(['f-field-wrapper']) }]));
  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, initialState);
  const coords =
    (data?.lon &&
      data?.lat && {
        lat: data.lat,
        lon: data.lon,
      }) ||
    undefined;
  const addressFields = [
    {
      label: 'Address',
      inputProps: {
        placeholder: 'Address',
        name: 'title',
      },
      generatedAddress: 'address',
    },
    {
      label: 'Unit',
      inputProps: {
        name: 'building_unit',
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
        name: 'state_province',
      },
      generatedAddress: 'state_province',
    },
    {
      label: 'Postal Code / ZIP Code',
      inputProps: {
        name: 'postal_zip_code',
      },
      generatedAddress: 'postal_zip_code',
    },
    {
      label: 'Neighbourhood',
      inputProps: {
        placeholder: 'Neighbourhood',
        name: 'region',
      },
      generatedAddress: 'neighbourhood',
    },
  ];
  const blockNext = () => ![data?.postal_zip_code, data?.state_province].every(Boolean);
  console.log(blockNext());
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['virtual-tours-inputs']),
      transformChild: child => {
        return cloneElement(
          child,
          {},
          addressFields.map(field => {
            const obj = data as unknown as object;
            const value = getValueByKey(field.inputProps.name, obj);
            const valueAlternative = data?.generatedAddress ? getValueByKey(field.generatedAddress, data.generatedAddress as object) : null;
            if (valueAlternative && !value) {
              fireEvent({
                [field.inputProps.name]: valueAlternative,
                lon: data?.generatedAddress?.lon,
                lat: data?.generatedAddress?.lat,
              });
            }
            return (
              <InputWithLabel
                key={field.inputProps.name}
                inputProps={field.inputProps ?? {}}
                label={field.label}
                template={templates.input}
                value={value ?? ''}
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
    { searchFn: searchByClasses(['tabs-standard', 'w-tabs']), transformChild: child => <MapsTabs child={child} coords={coords} /> },
    {
      searchFn: searchByPartOfClass(['f-button-neutral']),
      transformChild: child =>
        createElement('button', {
          ...removeKeys(child.props, ['href']),
          className: `${child.props.className} disabled:bg-gray-500 disabled:cursor-not-allowed`,
          disabled: blockNext(),
          onClick: nextStepClick,
        }),
    },
    {
      searchFn: searchByPartOfClass(['f-button-secondary']),
      transformChild: child =>
        createElement(
          'button',
          {
            ...removeKeys(child.props, ['href']),
            className: `${child.props.className} ${'disabled:bg-gray-500 disabled:cursor-not-allowed'}`,
            disabled: blockNext(),
            onClick: () => {
              saveAndExit(data);
            },
          },
          [child.props.children],
        ),
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
