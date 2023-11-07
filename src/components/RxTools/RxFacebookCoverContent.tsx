import React, { ReactElement } from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { getAgentHomePageUrl, getAgentPhoto } from '@/_utilities/data-helpers/agent-helper';

export default function RxFacebookCoverContent({ nodes, agent }: ReplacerPageProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['agent-name-fb']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          children: agent.full_name,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-phone']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          children: agent.phone,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-email']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          children: agent.email,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-url']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          children: getAgentHomePageUrl(agent),
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-photo']),
      transformChild: (child: ReactElement) => {
        const photo = getAgentPhoto(agent);

        return !photo ? (
          <></>
        ) : (
          <div
            className='bg-no-repeat bg-cover bg-center w-40 h-full'
            style={{
              backgroundImage: `url(${photo})`,
            }}
          />
        );
      },
    },
  ];

  return <>{transformMatchingElements(nodes, matches)}</>;
}
