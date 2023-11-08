import React from 'react';

import { Events } from '@/_typings/events';
import { PropertyDataModel } from '@/_typings/property';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import { loveHome, unloveHome } from '@/_utilities/api-calls/call-love-home';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

type LovedItem = PropertyDataModel & { love?: number };
export default function useLove() {
  const q = useSearchParams();
  const [data, setLovedData] = React.useState<{
    item: LovedItem;
    items: string[];
    remove?: boolean;
  }>();

  const onEvent = React.useCallback((e: CustomEvent) => {
    setLovedData({
      ...(e.detail as { item: LovedItem; remove?: boolean }),
      items: data?.items || [],
    });
  }, []);

  React.useEffect(() => {
    if (data && data.item) {
      const love_items: string[] = getData(Events.LovedItem) || [];
      if (data.remove) {
        // User wanted this removed
        const idx = love_items.indexOf(data.item.mls_id);
        if (idx >= 0) {
          love_items.splice(idx, 1);
          setData(Events.LovedItem, JSON.stringify(love_items, null, 4));
        }
      } else if (love_items.includes(data.item.mls_id) === false) {
        love_items.push(data.item.mls_id);
        setData(Events.LovedItem, JSON.stringify(love_items, null, 4));
      }
    }
  }, [data]);

  React.useEffect(() => {
    document.addEventListener(Events.LovedItem, onEvent as EventListener, false);
    return () => document.removeEventListener(Events.LovedItem, onEvent as EventListener, false);
  }, []);

  const fireEvent = React.useCallback((item: LovedItem, agent: number, remove = false) => {
    console.log('event fired in useLove for', item.mls_id);
    console.log('event tied to ', agent);
    console.log('customer', q.get('customer'));
    if (remove && item.love) {
      unloveHome(item.love);
    } else {
      loveHome(item.mls_id, agent, Cookies.get('session_as') === 'realtor' && q.get('customer') ? Number(q.get('customer')) : undefined);
    }

    document.dispatchEvent(
      new CustomEvent(Events.LovedItem, {
        detail: {
          item,
          remove,
        },
      }),
    );
  }, []);

  return { data, fireEvent };
}
