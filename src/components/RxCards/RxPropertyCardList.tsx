'use client';
import { LegacySearchPayload } from '@/_typings/pipeline';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import React from 'react';

export function FilterUpdateButton(props: { children: React.ReactElement; className: string }) {
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const [is_searching, toggleSearching] = React.useState(false);
  const { loading } = data as unknown as {
    loading: boolean;
  };

  React.useEffect(() => {
    if (is_searching) {
      toggleSearching(false);
    }
  }, [is_searching]);

  return (
    <button
      type='button'
      className={
        props.className +
        ' disabled:bg-indigo-300 disabled:text-indigo-400 disabled:cursor-progress disabled:pointer-events-none RxPropertyCardList-FilterUpdateButton'
      }
      onClick={() => {
        toggleSearching(true);
        fireEvent({ loading: true } as unknown as EventsData);
      }}
      disabled={is_searching}
    >
      {props.children}
    </button>
  );
}
export default function RxPropertyCardList({ className, children }: { children: React.ReactElement; className: string }) {
  const [searching, toggleSearch] = React.useState(false);
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const { filters, loading } = data as unknown as {
    filters: LegacySearchPayload;
    loading: boolean;
  };

  if (loading && !searching) {
    toggleSearch(true);
    fireEvent({ loading: false } as unknown as EventsData);
  }

  React.useEffect(() => {
    if (searching) {
      toggleSearch(false);

      console.log(JSON.stringify(filters, null, 4));
      console.log('search', { loading });
    }
  }, [searching]);
  return <>{children}</>;
}
