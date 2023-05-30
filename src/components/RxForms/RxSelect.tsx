'use client';
import React, { ReactElement, useRef, useState, useCallback, cloneElement } from 'react';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import useOutsideClick from '@/hooks/useOutsideClick';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { ValueInterface } from '@/_typings/ui-types';

interface SelectProps {
  wrapperNode: ReactElement;
  menuClassNames: string[];
  toggleClassNames: string[];
  placeholder?: string;
  // optional:
  selectedValue?: ValueInterface | null;
  values: ValueInterface[];
  handleSelect: (value: ValueInterface) => void;
  toggleStyle?: object;
  menuStyle?: object;
  wrapperStyle?: object;
}

export default function RxSelect(props: SelectProps) {
  const setRefsToggle = useRef(new Map()).current;
  const setRefsMenu = useRef(new Map()).current;

  const [show, setShow] = useState<boolean>(false);

  const handleClose = useCallback(() => setShow(false), []);
  useOutsideClick(null, handleClose, setRefsToggle);
  useOutsideClick(null, handleClose, setRefsMenu);

  const handleCloseClick = (value: ValueInterface) => {
    props.handleSelect(value);
    handleClose();
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['paragraph-small']),
      transformChild: child => {
        const selectedLabel = props?.selectedValue?.label || props?.placeholder || child.props.children;
        return cloneElement(child, {}, selectedLabel);
      },
    },
    {
      searchFn: searchByClasses(['dropdown-styled', 'w-dropdown']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          style: { zIndex: 'unset' },
        }),
    },
    {
      searchFn: searchByClasses(props.toggleClassNames),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          ref: (node: any) => (node ? setRefsToggle.set(child.key, node) : setRefsToggle.delete(child.key)),
          onClick: () => setShow(!show),
          style: { zIndex: 'unset' },
          // style: Object.assign({}, child.props.style, props.toggleStyle),
        }),
    },
    {
      searchFn: searchByClasses(props.menuClassNames),
      transformChild: (child: React.ReactElement) => {
        const rendered = React.cloneElement(
          child,
          {
            ...child.props,
            className: `${child.props.className} w--open`,
            style: { display: 'block', zIndex: 200 },
            // ref: (node: any) => (node ? setRefsMenu.set(child.key, node) : setRefsMenu.delete(child.key)),
          },
          [
            <div key={0} className='dropdown-wrap'>
              {props.values.map(({ value, label }, i) => (
                <a
                  className='dropdown-link w-dropdown-link w-full cursor-pointer'
                  key={`${value}_${i}`}
                  onClick={() => {
                    handleCloseClick({ value, label });
                  }}
                >
                  {label}
                </a>
              ))}
            </div>,
          ],
        );
        return show ? rendered : <></>;
      },
    },
  ];

  const wrapperClassName = props.wrapperNode.props.className;
  const style = Object.assign({}, props.wrapperNode.props.style, props.wrapperStyle);

  return transformMatchingElements(props.wrapperNode, matches) as ReactElement;
}
