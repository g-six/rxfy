'use client';
import useEvent, { Events } from '@/hooks/useEvent';
import React from 'react';

type Props = {
  children: React.ReactElement;
  attribute: string;
  className?: string;
};
export function RxAgentTextWrapper(p: Props) {
  const { data } = useEvent(Events.LoadUserSession);
  let user;
  if (data?.user) {
    user = data.user as {
      [key: string]: string;
    } & {
      brokerage?: {
        [key: string]: string;
      };
      id: number;
    };
  }
  return <>{user?.[p.attribute] ? user?.[p.attribute] : p.children}</>;
}
