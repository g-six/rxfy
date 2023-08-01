'use client';
import React from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { classNames } from '@/_utilities/html-helper';
import styles from './heart-toggle.module.scss';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import { LoveDataModel } from '@/_typings/love';

export default function HeartToggle({ children, className }: { children: React.ReactElement; className: string }) {
  const { data, fireEvent } = useEvent(Events.MapLoversToggle);
  const love = useEvent(Events.LoadLovers);
  const { loved_only } = data as unknown as {
    loved_only: boolean;
  };
  const local: string[] = getData(Events.LovedItem) || [];

  React.useEffect(() => {
    getLovedHomes().then((love_res: unknown) => {
      if (love_res) {
        const { records } = love_res as {
          records: LoveDataModel[];
        };

        if (records?.length) {
          love.fireEvent({
            lovers: records.map(rec => rec.property),
          } as unknown as EventsData);
          records.forEach(l => {
            if (!local.includes(l.property.mls_id)) local.push(l.property.mls_id);
          });
          if (local.length) {
            setData(Events.LovedItem, JSON.stringify(local));
          }
        }
      }
    });
  }, []);

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
