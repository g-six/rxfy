'use client';
import useEvent, { Events } from '@/hooks/useEvent';
import { ReactElement } from 'react';

interface ActionButtonProps {
  className: string;
  children: ReactElement;
}
export default function ActionButton(props: ActionButtonProps) {
  const { fireEvent } = useEvent(Events.GenericEvent);

  return (
    <button
      {...props}
      type='button'
      onClick={() => {
        fireEvent({
          show: true,
        });
      }}
    >
      {props.children}
    </button>
  );
}
