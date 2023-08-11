'use client';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events, EventsData } from '@/hooks/useFormEvent';
import { ReactElement } from 'react';

export default function DomainHowButton({ children, className }: { children: ReactElement; className: string }) {
  return (
    <div
      className={className + ' cursor-pointer'}
      onClick={() => {
        fireCustomEvent(
          {
            modal: 'domain-instructions',
          } as unknown as EventsData,
          Events.Blank,
        );
      }}
    >
      {children}
    </div>
  );
}
