'use client';
import React, { ReactElement } from 'react';

import { AgentData } from '@/_typings/agent';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { replaceAllTextWithBraces, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { getAgentPhoto } from '@/_utilities/data-helpers/agent-helper';

type Props = {
  child: ReactElement;
  agent: AgentData;
};

export default function RxPropertyAgent(props: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['agentface-wrapper']),
      transformChild: (child: ReactElement) => {
        const photo = props?.agent ? getAgentPhoto(props.agent) : '';
        const style = Object.assign({}, child.props.style, {
          backgroundImage: `url(${photo})`,
          backgroundPosition: 'center center',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        });
        return photo ? <div className={child.props.className} style={style} /> : <></>;
      },
    },
    {
      searchFn: searchByClasses(['div-block-44']),
      transformChild: (child: ReactElement) => {
        return replaceAllTextWithBraces(child, {
          'Agent Name': props?.agent?.full_name,
          'Agent Email': props?.agent?.email,
          'Agent Phone Number': props?.agent?.phone,
        }) as ReactElement;
      },
    },
  ];

  return <>{transformMatchingElements(props.child, matches)}</>;
}
