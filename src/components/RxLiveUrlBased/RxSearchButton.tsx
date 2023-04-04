'use client';
import { MapStateContext, useMapUpdater } from '@/app/AppContext.module';
import { useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function RxSearchButton({ children, className }: { className: string; children: React.ReactElement }) {
  const state = useContext(MapStateContext);
  const updater = useMapUpdater();
  const params = useSearchParams();
  const router = useRouter();

  return (
    <button
      type='button'
      className={`${className} rexified`}
      onClick={e => {
        e.preventDefault();
        let { query } = state;
        if (!query) {
          query = params.toString();
          const kvpairs: string[] = query.split('&').map(kvstr => {
            const [key] = kvstr.split('=');
            if (['minprice', 'maxprice', 'beds', 'baths', 'minsqft', 'maxsqft'].includes(key)) {
              return `${key}=${state[key]}`;
            }
            return kvstr;
          });
          query = kvpairs.join('&');
        }
        router.push(`/map?${query}`);
        updater(state, 'reload', true);
      }}
    >
      {children}
    </button>
  );
}
