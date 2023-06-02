import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import Checkbox from '@/_replacers/FilterFields/CheckBox';
import ChipsList from '@/_replacers/FilterFields/ChipList';
import ChipsWithLabel from '@/_replacers/FilterFields/ChipsWithLabel';
import InputWithLabel from '@/_replacers/FilterFields/InputWithLabel';
import SelectWithLabel from '@/_replacers/FilterFields/SelectWithLabel';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { ValueInterface } from '@/_typings/ui-types';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { cloneElement, useState } from 'react';

export default function TabStrata({ template, nextStepClick, attributes }: TabContentProps) {
  const { amenities } = attributes;
  const [templates] = useState(
    captureMatchingElements(template, [
      { elementName: 'input', searchFn: searchByPartOfClass(['f-field-wrapper']) },
      { elementName: 'checkbox', searchFn: searchByPartOfClass(['checkbox-wrap']) },
      { elementName: 'chipsWithLabel', searchFn: searchByPartOfClass(['chips-fieldset']) },
    ]),
  );
  const inputs = [
    {
      label: 'Building Bylaws',
      inputProps: {},
    },
    {
      label: 'Maintenance Fee',
      inputProps: {},
    },
    {
      label: 'Restrictions',
      inputProps: {},
    },
    {
      label: 'Age Restriction',
      inputProps: {},
    },
    {
      label: 'Dogs',
      inputProps: {},
    },
    {
      label: 'Cats',
      inputProps: {},
    },
    {
      label: 'Total Pets Allowed',
      inputProps: {},
    },
    {
      label: 'Total Rentals Allowed',
      inputProps: {},
    },
    {
      label: 'Complex Name',
      inputProps: {},
    },
  ];

  /// value and handleChange are for demo purpose
  const [value, setValue] = useState('');
  const [isPicked, setPicked] = useState(false);
  const [isPicked2, setPicked2] = useState(false);
  const [selectedChips, setSelectedChips] = useState<ValueInterface[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {};
  const handleSelect = (value: ValueInterface) => {
    const isIn = selectedChips?.some((item: ValueInterface) => item.value === value.value);
    const newArr = isIn ? selectedChips?.filter((item: ValueInterface) => item.value !== value.value) : [...(selectedChips ?? []), value];
    setSelectedChips([...newArr]);
  };

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['virtual-tours-inputs']),
      transformChild: child => {
        return cloneElement(
          child,
          {},

          [
            ...inputs.map((field, i) => (
              <InputWithLabel
                key={i}
                inputProps={field.inputProps ?? {}}
                label={field.label}
                template={templates.input}
                value={value}
                handleChange={handleChange}
              />
            )),
            <ChipsWithLabel
              key={`chipsList-1`}
              label='Building Amenities'
              template={templates.chipsWithLabel}
              values={selectedChips}
              handleSelect={handleSelect}
              chipsList={amenities}
            />,

            <div key={'containerrrrr'} className='flex gap-4 col-span-2'>
              <div className=' w-5/12 flex-shrink'>
                <Checkbox
                  key={'checkbox-1'}
                  isPicked={isPicked}
                  template={templates.checkbox}
                  item={{ title: 'Locker' }}
                  handleCheckList={() => {
                    setPicked(!isPicked);
                  }}
                />
              </div>

              <div className=' w-6/12 flex-shrink-0 flex-grow'>
                <Checkbox
                  key={'checkbox-2'}
                  isPicked={isPicked2}
                  template={templates.checkbox}
                  item={{ title: 'Council Approval Required' }}
                  handleCheckList={() => {
                    setPicked2(!isPicked2);
                  }}
                />
              </div>
            </div>,
          ],
        );
      },
    },
    { searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']), transformChild: child => cloneElement(child, { onClick: nextStepClick }) },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
  // return <>{template}</>;
}
