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
  loading?: boolean;
  children: React.ReactElement;
  data?: Record<string, string>;
  ['rx-event']: Events;
};
export function RxButtonV2(p: RxProps) {
  const { data, fireEvent } = useEvent(p['rx-event']);
  const [loading, toggleLoader] = React.useState(p.loading || false);

  React.useEffect(() => {
    if (data) {
      const { clicked } = data as unknown as { clicked: boolean };
      if (!clicked) toggleLoader(false);
    }
  }, [data]);

  return (
    <button
      type={p.type || 'button'}
      id={p.id}
      className={[p.className || '', 'rexified disabled:opacity-30 relative'].join(' ')}
      disabled={p.disabled || loading}
      onClick={(evt: React.MouseEvent<HTMLButtonElement>) => {
        evt.stopPropagation();
        toggleLoader(true);
        fireEvent({
          ...p.data,
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
