import React from 'react';
import { replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

type Props = {
  className: string;
  selector: string;
  children: React.ReactElement;
  values: {
    [key: string]: string | number | undefined | boolean | string[];
  };
};
export default function RxGenericLabeledValueBlock(p: Props) {
  return (
    <div className={p.className}>
      {transformMatchingElements(p.children, [
        {
          searchFn: searchByClasses([p.selector]),
          transformChild: (child: React.ReactElement) => {
            return replaceAllTextWithBraces(child, p.values) as React.ReactElement;
          },
        },
      ])}
    </div>
  );
}
