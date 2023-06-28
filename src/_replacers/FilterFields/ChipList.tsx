import { captureMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement } from 'react';
import ChipListItem from './ChipListItem';
import { ValueInterface } from '@/_typings/ui-types';

type Props = {
  template: ReactElement;
  chipsList: ValueInterface[];
  values: ValueInterface[];
  handleSelect: (val: ValueInterface) => void;
};

export default function ChipsList({ template, chipsList, values, handleSelect }: Props) {
  const { chip } = captureMatchingElements(template, [{ elementName: 'chip', searchFn: searchByClasses(['ptype-house']) }]);
  return (
    <div className={template.props.className}>
      {chipsList.map(item => {
        const isSelected = values.some(typeVal => typeVal.id === item.id);
        return <ChipListItem key={item.id} chip={chip} isSelected={isSelected} item={item} handleSelect={handleSelect} />;
      })}
    </div>
  );
}
