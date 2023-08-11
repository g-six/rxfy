'use client';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events } from '@/hooks/useEvent';
import { ReactElement, cloneElement } from 'react';

export default function RxThemeImg({ children, className, ...props }: { children: ReactElement; className: string; id: string }) {
  const class_list = `${className || ''}`.split('hidden').join('');
  const { data } = useEvent(Events.UpdateTheme);
  const { website_theme } = data as unknown as {
    website_theme: string;
  };
  return (
    <>
      {cloneElement(children, {
        ...props,
        className: classNames(class_list, props.id.includes(website_theme) ? '' : 'hidden'),
      })}
    </>
  );
}
