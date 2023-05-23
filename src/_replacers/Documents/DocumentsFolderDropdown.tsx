import React, { ReactElement, cloneElement } from 'react';

import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

type Props = {
  child: ReactElement;
  deleteFolder: () => void;
};

export default function DocumentsFolderDropdown({ child, deleteFolder }: Props) {
  const matches = [
    {
      searchFn: searchByClasses(['doc-delete']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { onClick: deleteFolder });
      },
    },
  ];

  return (
    <div className={`${child.props.className} w-max min-w-max`} style={{ display: 'block' }}>
      {transformMatchingElements(child.props.children, matches)}
    </div>
  );
}
