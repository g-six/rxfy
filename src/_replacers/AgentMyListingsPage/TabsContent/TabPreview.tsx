import axios from 'axios';
import React, { cloneElement } from 'react';

import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';

import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { AgentMetatags } from '@/_typings/agent';
import { domToReact, htmlToDOM } from 'html-react-parser';
import Image from 'next/image';

export default function TabPreview({ template, initialState, agent }: TabContentProps) {
  const { data } = useFormEvent<PrivateListingData & { page_url: string }>(Events.PrivateListingForm, initialState);
  const [lid, setLid] = React.useState<number | undefined>(data?.id);
  const [image, setImage] = React.useState<React.ReactElement>();
  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['pl-preview-wrapper']),
      transformChild: child => cloneElement(child, {}),
    },
  ];

  const loadPreview = () => {
    if (location && !image) {
      const { origin } = new URL(location.href || '');
      if (!agent.metatags) {
        const { agent_metatag } = agent as unknown as {
          agent_metatag: AgentMetatags;
        };
        agent.metatags = agent_metatag;
      }
      if (origin && agent.metatags && data?.id) {
        setImage(<Image src='/loading.gif' width='32' height='32' className='m-8' alt='property preview page is loading' />);
        axios
          .get([origin, 'api/private-listings', data.id, 'screengrab'].join('/') + `?agent=${agent.agent_id}&slug=${agent.metatags.profile_slug}`)
          .then(r => {
            if (r.data) {
              setLid(undefined);
              setImage(domToReact(htmlToDOM(r.data)) as React.ReactElement);
            }
          });
      }
    }
  };

  React.useEffect(loadPreview, [data, agent, image]);

  React.useEffect(() => {
    setImage(undefined);
    loadPreview();
  }, []);

  return data?.id ? (
    <div className='flex flex-col h-full'>
      {transformMatchingElements(template, matches)}{' '}
      <div className='rounded-xl overflow-hidden m-4 shadow items-center flex justify-center'>
        {image || <Image src='/loading.gif' width='32' height='32' className='m-8' alt='property preview page is loading' />}
      </div>
    </div>
  ) : (
    <></>
  );
}
