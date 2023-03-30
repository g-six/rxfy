'use client';
import { MapStateContext, useMapUpdater } from '@/app/AppContext.module';
import { useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export function RxSearchButton({ children, className }: { className: string; children: React.ReactElement }) {
  const router = useRouter();
  const pathname = usePathname();
  const state = useContext(MapStateContext);
  const updater = useMapUpdater();
  const params = useSearchParams();

  return (
    <button
      type='button'
      className={`${className} rexified`}
      onClick={() => {
        let { query } = state;
        if (!query) {
          query = params.toString();
        }
        if (!state.is_loading) {
          updater(state, 'query', query);
          updater(state, 'is_loading', true);
          router.push(`${pathname}?${query}`);
        }
      }}
    >
      {children}
    </button>
  );
}
