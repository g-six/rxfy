import React, { ReactElement, cloneElement, useEffect, useRef, useState } from 'react';

import useEvent, { Events } from '@/hooks/useEvent';
import useOutsideClick from '@/hooks/useOutsideClick';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

type Props = {
  child: ReactElement;
  id: number;
  deleteFolder: () => void;
};

export default function DocumentsFolderDropdown({ child, id, deleteFolder }: Props) {
  const [show, setShow] = useState<boolean>(false);
  const dropdownRef = useRef(null);
  const event = useEvent(Events.DocFolderShow);
  const handleClose = () => {
    event.fireEvent({ show: false, key: id });
  };
  useOutsideClick(dropdownRef, handleClose);
  useEffect(() => {
    if (event?.data && event?.data.show !== undefined) {
      setShow(event?.data.show);
    }
  }, [event, id]);
  const matches = [
    {
      searchFn: searchByClasses(['doc-delete']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { onClick: deleteFolder });
      },
    },
  ];
  return show ? (
    <div className={`${child.props.className} w-max min-w-max`} style={{ display: 'block' }} ref={dropdownRef}>
      {transformMatchingElements(child.props.children, matches)}
    </div>
  ) : (
    <></>
  );
}
