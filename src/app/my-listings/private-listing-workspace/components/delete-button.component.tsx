'use client';

import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { ReactElement } from 'react';

export default function MyListingsDeleteButton({ children, className, ...props }: { children: ReactElement; className: string; 'data-id': number }) {
  const { fireEvent: promptConfirmation } = useEvent(Events.Prompt);

  return (
    <button
      key={`delete-${props['data-id']}`}
      data-action='delete'
      className={classNames(className, 'bg-transparent')}
      onClick={() =>
        promptConfirmation({
          message: 'Are you sure you want to delete this private listing?',
          id: props['data-id'],
        } as unknown as EventsData)
      }
    >
      {children}
    </button>
  );
}
