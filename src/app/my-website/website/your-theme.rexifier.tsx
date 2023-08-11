'use client';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import useEvent, { Events } from '@/hooks/useEvent';
import { Children, ReactElement, cloneElement } from 'react';

function Rx({ children, ...props }: { children: ReactElement; theme: string }) {
  const rexified = Children.map(children, c => {
    if (c.props?.['data-field'] === 'theme_name') {
      return cloneElement(c, {}, capitalizeFirstLetter(props.theme));
    }
    return c;
  });
  return <>{rexified}</>;
}

export default function RxYourTheme({ children, className, theme }: { children: ReactElement; className: string; theme: string }) {
  const { data } = useEvent(Events.UpdateTheme);
  const { website_theme } = data as unknown as {
    website_theme: string;
  };
  return (
    <h6 className={className}>
      <Rx theme={website_theme || theme}>{children}</Rx>
    </h6>
  );
}
