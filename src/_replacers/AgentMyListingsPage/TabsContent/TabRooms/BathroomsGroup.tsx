import React, { cloneElement, useState } from 'react';

import Checkbox from '@/_replacers/FilterFields/CheckBox';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import { RoomsGroupProps, regularRow } from '@/_typings/agent-my-listings';
import { getValueByKey } from '@/hooks/useFormEvent';

export default function BathsGroup({ heading, rooms, headingTemplate, checkboxTemplate, inputTemplate, rowClassName = '', data, onChange }: RoomsGroupProps) {
  const inputsRowTemaplate = regularRow;
  const [isPicked, setPicked] = useState(false);
  return (
    <>
      {cloneElement(headingTemplate, {}, [heading ?? ''])}
      {Array.from({ length: rooms }, (_, index) => index).map(idx => (
        <div key={`${heading}_${idx}`} className={`${rowClassName} flex gap-5`}>
          {inputsRowTemaplate.map(input => {
            const key = input.inputProps.name;
            const val = data && data[idx] ? getValueByKey(key, data[idx]) : undefined;
            return (
              <InputWithLabel
                key={`${input.label}_${idx}`}
                label={input.label}
                value={val}
                handleChange={e => onChange(idx, key, e.currentTarget.value)}
                inputProps={input.inputProps}
                template={inputTemplate}
              />
            );
          })}
          {checkboxTemplate ? (
            <Checkbox isPicked={isPicked} template={checkboxTemplate} item={{ title: 'Ensuite' }} handleCheckList={() => onChange(idx, 'ensuite', !isPicked)} />
          ) : (
            ''
          )}
        </div>
      ))}
    </>
  );
}
