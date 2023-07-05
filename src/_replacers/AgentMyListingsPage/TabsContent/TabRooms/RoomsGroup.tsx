import React, { cloneElement } from 'react';

import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import { RoomsGroupProps, regularRow } from '@/_typings/agent-my-listings';
import { getValueByKey } from '@/hooks/useFormEvent';

export default function RoomsGroup({ heading = 'Rooms', rooms, headingTemplate, inputTemplate, rowClassName = '', data, onChange }: RoomsGroupProps) {
  const inputsRowTemaplate = regularRow;

  return (
    <>
      {cloneElement(headingTemplate, {}, [heading])}
      {Array.from({ length: rooms }, (_, index) => index).map(idx => (
        <div key={`${heading.split(' ').join('-')}_${idx}`} className={`${rowClassName} flex gap-5`}>
          {inputsRowTemaplate.map(input => {
            const key = input.inputProps.name;
            const val = data && data[idx] ? getValueByKey(key, data[idx]) : undefined;
            return (
              <InputWithLabel
                key={`${input.label.split(' ').join('-')}_${idx}_${heading.split(' ').join('-')}`}
                label={input.label}
                value={val}
                handleChange={e => {
                  onChange(idx, key, e.currentTarget.value);
                }}
                inputProps={input.inputProps}
                template={inputTemplate}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}
