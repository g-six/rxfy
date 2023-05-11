import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { classNames } from '@/_utilities/html-helper';
import { searchByClasses, searchByProp } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  chip: ReactElement;
  item: {
    label: string;
    value: string | number;
  };
  handleSelect: (val: string | number) => void;
  isSelected: boolean;
};

export default function ChipListItem({ chip, item, handleSelect, isSelected }: Props) {
  return (
    <>
      {transformMatchingElements(
        cloneElement(chip, {
          key: item.value,
          onClick: () => {
            handleSelect(item.value);
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
            transformChild: (child: ReactElement) => cloneElement(child, {}, [item.label]),
          },
        ],
      )}
    </>
  );
}
