import Checkbox from '@/_replacers/FilterFields/CheckBox';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import { RoomsGroupProps, regularRow } from '@/_typings/agent-my-listings';
import React, { cloneElement, useState } from 'react';

export default function BathsGroup({ heading, rooms, headingTemplate, checkboxTemplate, inputTemplate, rowClassName = '' }: RoomsGroupProps) {
  const inputsRowTemaplate = regularRow;
  const [isPicked, setPicked] = useState(false);
  return (
    <>
      {cloneElement(headingTemplate, {}, [heading ?? ''])}
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
          {checkboxTemplate ? (
            <Checkbox
              isPicked={isPicked}
              template={checkboxTemplate}
              item={{ title: 'Ensuite' }}
              handleCheckList={() => {
                setPicked(!isPicked);
              }}
            />
          ) : (
            ''
          )}
        </div>
      ))}
    </>
  );
}
