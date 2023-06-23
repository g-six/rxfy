import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { ValueInterface } from '@/_typings/ui-types';
import { classNames } from '@/_utilities/html-helper';
import { searchByClasses, searchByProp } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  chip: ReactElement;
  item: ValueInterface;
  handleSelect: (val: ValueInterface) => void;
  isSelected: boolean;
};

export default function ChipListItem({ chip, item, handleSelect, isSelected }: Props) {
  return (
    <>
      {transformMatchingElements(
        cloneElement(chip, {
          key: item.id,
          onClick: () => {
            handleSelect(item);
          },
        }),
        [
          {
            searchFn: searchByClasses(['w-checkbox-input']),
            transformChild: (child: ReactElement) => {
              return cloneElement(child, {
                className: classNames(child.props.className, isSelected ? 'w--redirected-checked' : ''),
              });
            },
          },
          {
            searchFn: searchByProp('type', 'checkbox'),
            transformChild: (child: ReactElement) => {
              return <></>;
            },
          },
          {
            searchFn: searchByClasses(['t-filter-label']),
            transformChild: (child: ReactElement) => cloneElement(child, {}, [item.name]),
          },
        ],
      )}
    </>
  );
}
