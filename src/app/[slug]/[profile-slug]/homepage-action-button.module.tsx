'use client';
import { ReactElement } from 'react';

interface ActionButtonProps {
  className: string;
  children: ReactElement;
}
export default function ActionButton(props: ActionButtonProps) {
  return (
    <button {...props} type='button'>
      {props.children}
    </button>
  );
}
