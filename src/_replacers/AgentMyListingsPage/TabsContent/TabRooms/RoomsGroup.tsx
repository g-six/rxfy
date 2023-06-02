import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import { RoomsGroupProps, regularRow } from '@/_typings/agent-my-listings';
import React, { cloneElement } from 'react';

export default function RoomsGroup({ heading, rooms, headingTemplate, inputTemplate, rowClassName = '' }: RoomsGroupProps) {
  const inputsRowTemaplate = regularRow;
  return (
    <>
      {cloneElement(headingTemplate, {}, [heading ?? 'Rooms'])}
      {Array.from({ length: rooms }, (_, index) => index).map(idx => (
        <div key={`bedroom_${idx}`} className={`${rowClassName} flex gap-5`}>
          {inputsRowTemaplate.map(input => (
            <InputWithLabel
              key={`${input.label}_${idx}`}
              label={input.label}
              value={''}
              handleChange={e => {}}
              inputProps={input.inputProps}
              template={inputTemplate}
            />
          ))}
        </div>
      ))}
    </>
  );
}
