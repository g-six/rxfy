'use client';

import { ReactElement, Fragment, Children, cloneElement, useState } from 'react';
import { Transition } from '@headlessui/react';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events } from '@/hooks/useEvent';
import styles from './styles.module.scss';
import { DOMNode, domToReact, htmlToDOM } from 'html-react-parser';

interface RequestInfoPopupProps {
  children: ReactElement;
  className?: string;
  tag?: string;
  value?: string;
  'data-action'?: string;
}

function CloseButton({ children, tag, ...p }: RequestInfoPopupProps) {
  const evt = useEvent(Events.GenericAction);
  const attr = {
    ...p,
    onClick: () => {
      console.log(evt.data);
      evt.fireEvent({
        show: false,
      });
    },
  };
  if (children) return cloneElement(domToReact(htmlToDOM(`<${tag} />`) as DOMNode[]) as ReactElement, attr, children);
  return cloneElement(domToReact(htmlToDOM(`<${tag} />`) as DOMNode[]) as ReactElement, attr);
}

function SubmitButton(p: RequestInfoPopupProps) {
  const [loading, toggleLoading] = useState(false);
  const { children, ...attr } = p;
  return (
    <button
      {...attr}
      type='button'
      disabled={loading}
      onClick={() => {
        toggleLoading(true);
      }}
    >
      {loading ? (
        <>
          <svg className='h-6 w-6 animate-spin' viewBox='3 3 18 18'>
            <path
              className='fill-indigo-200'
              d='M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z'
            ></path>
            <path
              className='fill-indigo-800'
              d='M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z'
            ></path>
          </svg>
          <span>Emailing...</span>
        </>
      ) : (
        <>
          {children}
          {attr.value || ''}
        </>
      )}
    </button>
  );
}

function Iterator(p: RequestInfoPopupProps) {
  const Rexified = Children.map(p.children, c => {
    if (c.props?.['data-action'] === 'close_modal') {
      return (
        <CloseButton {...c.props} tag={c.type}>
          {c.props.children || ''}
        </CloseButton>
      );
    }
    if (c.props?.['data-action'] === 'submit') {
      return (
        <SubmitButton {...c.props} tag={c.type}>
          {c.props.children || ''}
        </SubmitButton>
      );
    }
    if (c.props?.children && typeof c.props.children !== 'string') {
      const { children, className, ...attr } = c.props;
      return cloneElement(
        c.type === 'form' ? <div /> : c,
        {
          ...attr,
          className: classNames(className || 'no-default-clas', `rexified-${c.type}`),
        },
        <Iterator {...attr}>{children}</Iterator>,
      );
    }
    return c;
  });

  return <>{Rexified}</>;
}

export default function RequestInfoPopup({ children, ...p }: RequestInfoPopupProps) {
  const evt = useEvent(Events.GenericAction);

  return (
    <Transition
      key='confirmation'
      show={evt.data?.show}
      as={'section'}
      className={classNames(p.className || '', evt.data?.show ? styles.popup : '')}
      enter='transform ease-out duration-300 transition'
      enterFrom='translate-y-2 opacity-0 sm:translate-y-0'
      enterTo='translate-y-0 opacity-100'
      leave='transition ease-in duration-100'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
    >
      <Iterator {...p}>{children}</Iterator>
    </Transition>
  );
}
