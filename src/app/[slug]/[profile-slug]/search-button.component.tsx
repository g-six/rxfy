'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { objectToQueryString } from '@/_utilities/url-helper';
import useEvent, { Events } from '@/hooks/useEvent';

export default function HomePageSearchButton(props: any) {
  const router = useRouter();
  const params = useParams();
  const evt = useEvent(Events.MapSearch);

  useEffect(() => {
    if (evt.data) {
      const q = objectToQueryString(evt.data as unknown as { [k: string]: string });
      if (q) {
        let redirect_to = '/map';
        if (params.slug) redirect_to = `/${params.slug}${redirect_to}`;
        router.push(`${redirect_to}?${q}`);
      }
    }
  }, [evt.data]);
  return (
    <button type='button' className={props.className || ''}>
      {props.children}
    </button>
  );
}
