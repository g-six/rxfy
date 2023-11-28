'use client';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { ChangeEvent } from 'react';
export default function UpdatePasswordInputComponent(props: { name: string }) {
  const { fireEvent } = useEvent(Events.UpdatePassword);

  return (
    <input
      {...props}
      onChange={(evt: ChangeEvent<HTMLInputElement>) => {
        fireEvent({
          password: evt.currentTarget.value,
        } as unknown as EventsData);
      }}
    />
  );
}
