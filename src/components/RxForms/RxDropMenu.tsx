'use client';
import React, { ReactElement, useRef, useState, useCallback, cloneElement } from 'react';

import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import useOutsideClick from '@/hooks/useOutsideClick';

interface DropMenuProps {
  wrapperNode: ReactElement;
  menuClassNames: string[];
  toggleClassNames: string[];
  menuRenderer: (child: ReactElement) => {};
  // optional:
  toggleStyle?: object;
  menuStyle?: object;
  wrapperStyle?: object;
}

export default function RxDropMenu(props: DropMenuProps) {
  const setRefsToggle = useRef(new Map()).current;
  const setRefsMenu = useRef(new Map()).current;

  const [show, setShow] = useState<boolean>(false);

  const handleClose = useCallback(() => setShow(false), []);
  useOutsideClick(null, handleClose, setRefsToggle);
  useOutsideClick(null, handleClose, setRefsMenu);

  const wrapperClassName = props.wrapperNode.props.className;
  const style = Object.assign({}, props.wrapperNode.props.style, props.wrapperStyle);
  const matches = [
    {
      searchFn: searchByClasses(['my-listing-dropdown']),
      transformChild: (child: ReactElement) => cloneElement(child, { style }),
    },
    {
      searchFn: searchByClasses(props.toggleClassNames),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          ref: (node: any) => (node ? setRefsToggle.set(child.key, node) : setRefsToggle.delete(child.key)),
          onClick: () => setShow(!show),
          style: Object.assign({}, child.props.style, props.toggleStyle),
        }),
    },
    {
      searchFn: searchByClasses(props.menuClassNames),
      transformChild: (child: React.ReactElement) => {
        const rendered = React.cloneElement(child, {
          ...child.props,
          ref: (node: any) => (node ? setRefsMenu.set(child.key, node) : setRefsMenu.delete(child.key)),
        });
        return show ? (props.menuRenderer(rendered) as ReactElement) : <></>;
      },
    },
  ];

  return (
    <div className={wrapperClassName} style={style}>
      {transformMatchingElements(props.wrapperNode, matches)}
    </div>
  );
}
