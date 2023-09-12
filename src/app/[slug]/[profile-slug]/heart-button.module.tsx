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
  const [loved_items, setLovedItems] = useState(getData(Events.LovedItem) as unknown as string[]);
  const evt = useLove();
  const onClick = () => {
    evt.fireEvent(
      listing,
      agent.id,
      // remove,
    );
  };

  useEffect(() => {
    if (!loved_items) {
      setLovedItems((getData(Events.LovedItem) as unknown as string[]) || []);
    }
  }, []);

  return (
    <button
      type='button'
      className={classNames(loved_items && loved_items.includes(listing.mls_id) ? className.split(' opacity-0').join(' opacity-100') : className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
