import React, { ReactElement } from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

import RxSmartBusinessCard from '@/components/RxTools/RxSmartBusinessCard';
import RxEmailSignature from '@/components/RxTools/RxEmailSignature';
import RxFacebookCover from '@/components/RxTools/RxFacebookCover';
import RxPaperBusinessCard from '@/components/RxTools/RxPaperBusinessCard';
import RxPropertyBrochures from '@/components/RxTools/RxPropertyBrochures';
import { getAgentPhoto } from '@/_utilities/data-helpers/agent-helper';

export default async function RxTools({ agent, nodes }: ReplacerPageProps) {
  let headshot = getAgentPhoto(agent);
  if (headshot) {
    const agent_headshot_req = await fetch(headshot);
    const content_type = agent_headshot_req.headers.get('content-type');
    const buff = await agent_headshot_req.arrayBuffer();
    headshot = `data:${content_type};base64,${Buffer.from(buff).toString('base64')}`;
  }
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['smart-business-card-tab']),
      transformChild: (child: ReactElement) => {
        return <RxSmartBusinessCard nodes={[child]} nodeClassName={child.props.className} nodeProps={child.props} agent={agent} />;
      },
    },
    {
      searchFn: searchByClasses(['email-signature-tab']),
      transformChild: (child: ReactElement) => {
        return <RxEmailSignature nodes={[child]} nodeClassName={child.props.className} nodeProps={child.props} agent={agent} />;
      },
    },
    {
      searchFn: searchByClasses(['facebook-cover-tab']),
      transformChild: (child: ReactElement) => {
        return (
          <RxFacebookCover
            nodes={[child]}
            nodeClassName={child.props.className}
            nodeProps={child.props}
            agent={{
              ...agent,
              metatags: {
                ...agent.metatags,
                headshot,
              },
            }}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['paper-business-card-tab']),
      transformChild: (child: ReactElement) => {
        return <RxPaperBusinessCard nodes={[child]} nodeClassName={child.props.className} nodeProps={child.props} agent={agent} />;
      },
    },
    {
      searchFn: searchByClasses(['property-brochure-tab']),
      transformChild: (child: ReactElement) => {
        return <RxPropertyBrochures nodes={[child]} nodeClassName={child.props.className} nodeProps={child.props} agent={agent} />;
      },
    },
  ];

  return <>{agent ? transformMatchingElements(nodes, matches) : nodes}</>;
}
