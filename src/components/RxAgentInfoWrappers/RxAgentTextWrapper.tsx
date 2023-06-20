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
  React.useEffect(() => {
    console.log({ data });
  }, [data]);
  if (data) {
    user = data as {
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
