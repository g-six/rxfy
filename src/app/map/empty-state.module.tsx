'use client';
import React from 'react';
import styles from './home-list.module.scss';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import useEvent, { Events } from '@/hooks/useEvent';

function Iterator({ children, reset }: { children: React.ReactElement; reset(): void }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      const { children: subchildren, ...props } = c.props;
      return (
        <div {...props}>
          <Iterator reset={reset}>{subchildren}</Iterator>
        </div>
      );
    }
    if (c.type === 'a') {
      return (
        <button type='button' className={c.props.className} onClick={reset}>
          {convertDivsToSpans(c.props.children)}
        </button>
      );
    }

    return c;
  });
  return <>{Wrapped}</>;
}

export default function EmptyState({ className, children }: { className: string; children: React.ReactElement }) {
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const { points } = data as unknown as {
    points?: unknown[];
  };
  return (
    <div className={[className, points && points.length > 0 ? styles['filled-state'] : styles['empty-state'], 'rexified HomeList-EmptyState'].join(' ')}>
      <Iterator
        reset={() => {
          fireEvent({
            ...data,
            clicked: 'reset',
            reload: true,
          });
        }}
      >
        {children}
      </Iterator>
    </div>
  );
}
