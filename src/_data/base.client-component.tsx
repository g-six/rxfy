'use client';

import { ReactElement, cloneElement, useEffect, useState } from 'react';

const FILE = 'base.client-component.tsx';
export default function BaseClientComponent({ component }: { component: ReactElement }) {
  const [is_ready, toggleReady] = useState(false);
  useEffect(() => {
    if (component.type === 'img') {
      if (component.props.src && !component.props.src.includes('pages.leagent.com')) {
        fetch(component.props.src)
          .then(r => {
            toggleReady(r.ok);
          })
          .catch(() => {
            console.log(FILE, 'Image not found');
          });
      } else {
        toggleReady(true);
      }
    } else toggleReady(true);
  }, []);

  return is_ready
    ? cloneElement(component, { 'data-component': undefined, 'data-rexifier': FILE })
    : cloneElement(component, {
        'data-component': undefined,
        ...(component.type === 'img' && !component.props.src.includes('pages.leagent.com')
          ? {
              src: component.props['data-original-src'],
              srcSet: component.props['data-original-src-set'] || undefined,
              'data-rexifier': FILE,
            }
          : {}),
      });
}
