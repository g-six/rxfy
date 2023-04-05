'use client';

import { Events } from '@/_typings/events';
import useEvent from '@/hooks/useEvent';
import React from 'react';
import styles from './RxButton.module.scss';

type RxProps = {
  id: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  children: React.ReactElement;
  data?: Record<string, string>;
  ['rx-event']: Events;
};
export function RxButton(p: RxProps) {
  const { data, fireEvent } = useEvent(p['rx-event']);
  const [loading, toggleLoader] = React.useState(false);

  React.useEffect(() => {
    if (!data.clicked) {
      toggleLoader(false);
    }
  }, [data]);

  return (
    <button
      type={p.type || 'button'}
      className={[p.className || '', 'rexified disabled:opacity-30 relative'].join(' ')}
      disabled={p.disabled}
      onClick={() => {
        toggleLoader(true);
        fireEvent({
          ...data,
          clicked: p.id,
        });
      }}
    >
      <span className={loading ? styles.loader : 'hidden'} />
      <span>{p.children}</span>
    </button>
  );
}
