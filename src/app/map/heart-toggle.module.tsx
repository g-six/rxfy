'use client';
import React from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { classNames } from '@/_utilities/html-helper';
import styles from './heart-toggle.module.scss';

export default function HeartToggle({ children, className }: { children: React.ReactElement; className: string }) {
  const { data, fireEvent } = useEvent(Events.MapLoversToggle);
  const { loved_only } = data as unknown as {
    loved_only: boolean;
  };
  return (
    <button
      type='button'
      className={classNames(className, loved_only && styles.loved)}
      onClick={() => {
        fireEvent({
          ...data,
          loved_only: !loved_only,
        } as unknown as EventsData);
      }}
    >
      {children}
    </button>
  );
}
