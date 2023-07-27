'use client';
import React from 'react';
import styles from './home-list.module.scss';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { useRouter, useSearchParams } from 'next/navigation';
import { objectToQueryString, queryStringToObject } from '@/_utilities/url-helper';
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
  const search = useSearchParams();
  const router = useRouter();
  const { fireEvent } = useEvent(Events.MapSearch);
  return (
    <div className={[className, styles['empty-state'], 'rexified HomeList-EmptyState'].join(' ')}>
      <Iterator
        reset={() => {
          const q = queryStringToObject(search.toString());
          delete q.types;
          delete q.date;
          delete q.year_built;
          delete q.maxsqft;
          delete q.minsqft;
          delete q.maxprice;
          delete q.minprice;
          router.push(
            'map?' +
              objectToQueryString({
                ...q,
                minprice: 340000,
                maxprice: 20000000,
              }),
          );
          fireEvent({
            reload: true,
          });
        }}
      >
        {children}
      </Iterator>
    </div>
  );
}
