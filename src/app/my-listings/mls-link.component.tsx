'use client';

import { getMLSProperty } from '@/_utilities/api-calls/call-properties';
import { ReactElement } from 'react';

export default function MLSLinkComponent({ children, mls_id, ...props }: { children: ReactElement; mls_id: string; href: string }) {
  return (
    <a
      {...props}
      onClick={e => {
        getMLSProperty(mls_id);
      }}
    >
      {children}
    </a>
  );
}
