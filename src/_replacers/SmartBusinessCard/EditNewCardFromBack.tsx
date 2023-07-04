import React, { cloneElement } from 'react';

import { AgentData } from '@/_typings/agent';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

type Props = {
  qr: string | undefined | null;
  logoPreview: string | undefined | null;
  nodes: React.ReactElement[];
  agent: AgentData;
};

export default function EditNewCardFormBack({ nodes, agent, qr, logoPreview }: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['smart-card-agent-phone']),
      transformChild: child => cloneElement(child, {}, agent?.phone ?? ''),
    },
    {
      searchFn: searchByClasses(['smart-card-agent-qr']),
      transformChild: child => (qr ? cloneElement(child, { src: qr }) : <></>),
    },
    {
      searchFn: searchByClasses(['smart-card-logo-back']),
      transformChild: child => cloneElement(child, {}, logoPreview ? [<img key={0} src={logoPreview} alt='Smart Card Agent Back Logo' />] : []),
    },
  ];
  return <>{transformMatchingElements(nodes, matches)}</>;
}
