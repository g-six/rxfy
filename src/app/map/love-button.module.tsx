'use client';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import React from 'react';
import styles from './home-list.module.scss';
import { PropertyDataModel } from '@/_typings/property';
import useLove from '@/hooks/useLove';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { Events } from '@/hooks/useFormEvent';
import { classNames } from '@/_utilities/html-helper';

export default function LoveButton({ className, children, listing }: { className: string; children: React.ReactElement; listing: PropertyDataModel }) {
  const evt = useLove();
  const [loved_items, setLovedItems] = React.useState(getData(Events.LovedItem) as unknown as string[]);
  const [loved, toggle] = React.useState(loved_items?.includes(listing.mls_id) || false);
  const onLove = () => {
    evt.fireEvent(
      {
        ...listing,
      },
      1,
      loved,
    );
    toggle(!loved);
  };

  React.useEffect(() => {
    if (evt.data?.item && evt.data.item.mls_id === listing.mls_id) {
      setLovedItems(getData(Events.LovedItem) as unknown as string[]);
    }
  }, [evt.data]);

  return (
    <button type='button' className={classNames(className, styles['love-button'], loved_items?.includes(listing.mls_id) && styles.loved)} onClick={onLove}>
      {convertDivsToSpans(children)}
    </button>
  );
}
