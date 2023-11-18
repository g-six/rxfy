'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { objectToQueryString } from '@/_utilities/url-helper';
import MapSearchInput from '@/app/map/search-input.module';
import useEvent, { Events } from '@/hooks/useEvent';

export default function HomePageSearchInput(props: any) {
  const router = useRouter();
  const params = useParams();
  const evt = useEvent(Events.MapSearch);
  console.log(evt.data);
  useEffect(() => {
    if (evt.data) {
      const q = objectToQueryString(evt.data as unknown as { [k: string]: string });
      if (q) {
        let redirect_to = '/map';
        if (params.slug && params['profile-slug'] && params['profile-slug'].indexOf('la-') === 0)
          redirect_to = `/${params.slug}/${params['profile-slug']}${redirect_to}`;
        router.push(`${redirect_to}?${q}`);
      }
    }
  }, [evt.data]);
  return <MapSearchInput className={props.className || ''} placeholder={props.placeholder || ''} />;
}
