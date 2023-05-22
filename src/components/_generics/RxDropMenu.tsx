import React, { ReactElement, useRef, useState, useCallback } from 'react';
import { randomUUID } from 'crypto';

import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import useOutsideClick from '@/hooks/useOutsideClick';

interface DropMenuProps {
  wrapperNode: ReactElement;
  menuClassNames: string[];
  toggleClassNames: string[];
  items: {
    itemClassNames: string[];
    itemCallback: (uuid: string, el: ReactElement) => {};
  }[];
  // optional:
  toggleStyle?: object;
  menuStyle?: object;
  wrapperStyle?: object;
  key?: any;
}

export default function RxDropMenu(props: DropMenuProps) {
  const setRefsToggle = useRef(new Map()).current;
  const setRefsMenu = useRef(new Map()).current;

  const [uuid] = useState<string>(props.key ? props.key : randomUUID());

  const [show, setShow] = useState<boolean>(false);

  const handleClose = useCallback(() => setShow(!show), [show]);
  useOutsideClick(null, handleClose, setRefsToggle);
  useOutsideClick(null, handleClose, setRefsMenu);

  const matches = [
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
        const menuMatches = props.items.map(manuItem => {
          return {
            searchFn: searchByClasses(manuItem.itemClassNames),
            transformChild: (ch: React.ReactElement) =>
              React.cloneElement(ch, {
                ...ch.props,
                onClick: () => manuItem.itemCallback(uuid, ch),
              }),
          };
        });
        return transformMatchingElements(rendered, menuMatches) as ReactElement;
      },
    },
  ];

  const wrapperClassName = props.wrapperNode.props.className;
  const style = Object.assign({}, props.wrapperNode.props.style, props.wrapperStyle);

  return (
    <div className={wrapperClassName} style={style}>
      {transformMatchingElements(props.wrapperNode.props.children, matches)}
    </div>
  );
}
