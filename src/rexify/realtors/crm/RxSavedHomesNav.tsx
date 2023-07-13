'use client';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import React from 'react';

function Iterator(p: {
  children?: React.ReactElement;
  id?: string;
  className?: string;
  'active-tab': string;
  onNavClick: (evt: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child?.type === 'a' && typeof child.props?.children !== 'string') {
      return React.cloneElement(<button type='button' />, {
        ...child.props,
        className: classNames(
          'flex items-center min-w-max RxSavedHomesNav',
          p['active-tab'] === child.props['data-w-tab'] ? child.props.className : child.props.className.split('w--current').join(''),
          p['active-tab'] === child.props['data-w-tab'] && 'w--current',
        ),
        children: <span>{child.props.children.props.children}</span>,
        onClick: p.onNavClick,
      });
    }
    return child;
  });
  return <>{Wrapped}</>;
}

export default function RxSavedHomesNav(p: { className: string; children: React.ReactElement; 'active-tab': string }) {
  const session = useEvent(Events.LoadUserSession);
  React.useEffect(() => {
    session.fireEvent({
      ...session.data,
      clicked: `${Events.LoadMap}-trigger`,
    });
  }, []);

  return (
    <nav {...p}>
      <Iterator
        active-tab={p['active-tab']}
        onNavClick={(evt: React.MouseEvent<HTMLButtonElement>) => {
          switch (evt.currentTarget.textContent) {
            case 'Map View':
              session.fireEvent({
                ...session.data,
                ['active-crm-saved-homes-view']: evt.currentTarget.getAttribute('data-w-tab'),
                clicked: `${Events.LoadMap}-trigger`,
              } as unknown as EventsData);
              break;
            default:
              session.fireEvent({
                ...session.data,
                ['active-crm-saved-homes-view']: evt.currentTarget.getAttribute('data-w-tab'),
                clicked: undefined,
              } as unknown as EventsData);
              break;
          }
        }}
      >
        {p.children}
      </Iterator>
    </nav>
  );
}
