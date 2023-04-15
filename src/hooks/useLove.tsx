import React from 'react';

import { Events } from '@/_typings/events';
import { MLSProperty } from '@/_typings/property';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import Cookies from 'js-cookie';
import { loveHome } from '@/_utilities/api-calls/call-love-home';
import axios from 'axios';

export default function useLove() {
  const [data, setLovedData] = React.useState<{
    item: MLSProperty;
    remove?: boolean;
  }>();

  const onEvent = React.useCallback((e: CustomEvent) => setLovedData(e.detail as { item: MLSProperty; remove?: boolean }), []);

  React.useEffect(() => {
    if (data && data.item) {
      const love_items: string[] = getData(Events.LovedItem) || [];
      if (data.remove) {
        // User wanted this removed
        const idx = love_items.indexOf(data.item.MLS_ID);
        if (idx >= 0) {
          love_items.splice(idx, 1);
          setData(Events.LovedItem, JSON.stringify(love_items, null, 4));
        }
      } else if (love_items.includes(data.item.MLS_ID) === false) {
        love_items.push(data.item.MLS_ID);
        setData(Events.LovedItem, JSON.stringify(love_items, null, 4));
      }
    }
  }, [data]);

  React.useEffect(() => {
    document.addEventListener(Events.LovedItem, onEvent as EventListener, false);
    return () => document.removeEventListener(Events.LovedItem, onEvent as EventListener, false);
  }, []);

  const fireEvent = React.useCallback((item: MLSProperty, agent: number, remove = false) => {
    // if user is in session, let's update
    if (Cookies.get('cid') && Cookies.get('session_key')) {
      axios.post(`/property?mls=${item.MLS_ID}`).catch(console.log);
      loveHome(item.MLS_ID, agent);
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
