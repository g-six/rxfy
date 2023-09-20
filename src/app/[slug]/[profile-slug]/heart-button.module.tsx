'use client';

import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { classNames } from '@/_utilities/html-helper';
import { Events } from '@/hooks/useFormEvent';
import useLove from '@/hooks/useLove';
import { ReactElement, useEffect, useState } from 'react';

export default function HeartButton({
  agent,
  listing,
  className,
  children,
}: {
  agent: AgentData;
  listing: PropertyDataModel;
  className: string;
  children: ReactElement;
}) {
  const [loved_items, setLovedItems] = useState<string[]>([]);
  const evt = useLove();
  const onClick = () => {
    let remove = false;
    if (loved_items && loved_items.includes(listing.mls_id)) remove = true;

    if (remove) setLovedItems(loved_items.filter(mls_id => mls_id !== listing.mls_id));
    else setLovedItems(loved_items.concat([listing.mls_id]));

    evt.fireEvent(listing, agent.id, remove);
  };

  useEffect(() => {
    setLovedItems(getData(Events.LovedItem) as unknown as string[]);
  }, []);

  const is_loved = ((getData(Events.LovedItem) as unknown as string[]) || []).includes(listing.mls_id);
  if (is_loved) console.log(listing.mls_id, 'is loved');

  const getStateCss = () => {
    if (is_loved) {
      if (className.includes('-full')) return ' hover:opacity-0 opacity-100';
      else return ' hover:opacity-100 opacity-0';
    } else {
      if (className.includes('-empty')) return ' hover:opacity-0 opacity-100';
      else return ' hover:opacity-100 opacity-0';
    }
  };

  return (
    <button type='button' onClick={onClick} data-mls={listing.mls_id} data-is-loved={is_loved} className={classNames(className, listing.mls_id, getStateCss())}>
      {children}
    </button>
  );
}
