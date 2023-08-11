'use client';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events, EventsData } from '@/hooks/useFormEvent';
import { Children, ReactElement, cloneElement } from 'react';
import styles from './DomainHowModal.module.scss';
import { classNames } from '@/_utilities/html-helper';
import useEvent from '@/hooks/useEvent';
function CloseButton({ children }: { children: ReactElement }) {
  return (
    <div
      className={(children.props.className || '') + ' w-4 h-4 bg-no-repeat bg-center'}
      onClick={() => {
        fireCustomEvent({} as unknown as EventsData, Events.Blank);
      }}
      style={{
        backgroundImage: `url(${children.props.src})`,
      }}
    ></div>
  );
}
function Rexify({ children }: { children: ReactElement }) {
  const Rexified = Children.map(children, c => {
    if (c.type === 'div') {
      const { children: sub, ...props } = c.props;
      return (
        <div {...props}>
          <Rexify>{sub}</Rexify>
        </div>
      );
    }
    if (c.props?.className?.includes('-close') || c.props?.className?.includes('close-')) {
      return <CloseButton>{c}</CloseButton>;
    }
    if (typeof c.props?.children === 'string') {
      if (c.props.children.toLowerCase() === 'close') {
        return (
          <button
            type='button'
            className={c.props.className || ''}
            onClick={() => {
              fireCustomEvent({} as unknown as EventsData, Events.Blank);
            }}
          >
            {c.props.children}
          </button>
        );
      }
    }
    return c;
  });
  return <>{Rexified}</>;
}
export default function DomainHowModal({ children, className }: { children: ReactElement; className: string }) {
  const { data } = useEvent(Events.Blank);
  const { modal } = data as unknown as {
    modal?: string;
  };
  console.log(modal);
  return (
    <div className={classNames(className, modal?.includes(className) ? styles.show : '')}>
      <Rexify>{children}</Rexify>
    </div>
  );
}
