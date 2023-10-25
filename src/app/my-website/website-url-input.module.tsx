'use client';

import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { ChangeEvent } from 'react';

export default function WebsiteURLInput(props: { className: string }) {
  const { fireEvent } = useEvent(Events.UpdateWebsite);

  return (
    <input
      {...props}
      onChange={(evt: ChangeEvent<HTMLInputElement>) => {
        fireEvent({
          domain_name: evt.currentTarget.value,
        } as EventsData);
      }}
    />
  );
}
