'use client';

import useEvent, { Events } from '@/hooks/useEvent';
import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';

function Iterator({ children, ...props }: { children: ReactElement; onClose(): void }) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      if (c.props['data-action'] === 'close') {
        return cloneElement(c, {
          onClick: () => {
            props.onClose();
          },
        });
      }
      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(c, {}, <Iterator {...props}>{c.props.children}</Iterator>);
      }
      return c;
    }
    return c;
  });

  return <>{rexified}</>;
}

export default function DataModal({ element, ...props }: { 'data-modal': string; element: ReactElement }) {
  const handler = useEvent('open-popup' as unknown as Events);
  const [is_ready, toggleReady] = useState(false);
  const [is_shown, toggleVisibility] = useState(false);

  useEffect(() => {
    if (handler.data?.message === 'show.' + props['data-modal']) {
      toggleVisibility(true);
    }
  }, [handler.data?.message]);

  useEffect(() => {
    toggleReady(true);
  }, []);

  return is_ready
    ? cloneElement(
        element,
        {
          style: is_shown ? { display: 'flex' } : element.props.style || undefined,
        },
        <Iterator
          onClose={() => {
            toggleVisibility(false);
            handler.fireEvent({
              message: `hide.${props['data-modal']}`,
            });
          }}
        >
          {element.props.children}
        </Iterator>,
      )
    : element;
}
