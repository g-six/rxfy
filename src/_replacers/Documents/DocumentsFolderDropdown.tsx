import useEvent, { Events } from '@/hooks/useEvent';
import useOutsideClick from '@/hooks/useOutsideClick';
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  child: ReactElement;
  id: number;
};

export default function DocumentsFolderDropdown({ child, id }: Props) {
  const [show, setShow] = useState<boolean>(false);
  const dropdownRef = useRef(null);
  const event = useEvent(Events.DocFolderShow);
  const handleClose = () => {
    console.log('close', id);
    event.fireEvent({ show: false, key: id });
  };
  useOutsideClick(dropdownRef, handleClose);
  useEffect(() => {
    if ([event?.data, Object.keys(event.data).length, event?.data?.key === id].every(Boolean)) {
      console.log(event?.data, id, event?.data?.key);
      setShow(!!event.data.show);
    }
  }, [event, id]);
  return show ? (
    <div className={child.props.className} style={{ display: 'block' }} ref={dropdownRef}>
      {child.props.children}
    </div>
  ) : (
    <></>
  );
}
