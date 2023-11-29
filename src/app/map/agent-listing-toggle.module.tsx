'use client';

import React, { Children, ReactElement, cloneElement } from 'react';
import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events } from '@/hooks/useEvent';

import styles from './agent-listing-toggle.module.scss';

function Iterator({ agent, children, ...props }: { agent: AgentData; children: React.ReactElement; show?: boolean }) {
  const Wrapped = React.Children.map(children, c => {
    if (typeof c.props?.children === 'string') {
      return React.cloneElement(c, c.props, [c.props.children.split('{Agent Name}').join(agent.full_name)]);
    } else if (c.type === 'div') {
      if (c.props?.className.includes('toggle-base')) {
        return (
          <div
            className='toggle-base'
            onClick={evt => {
              evt.preventDefault();
              evt.stopPropagation();
              document.querySelectorAll('.toggle-base').forEach(item => {
                item.removeAttribute('data-w-id');
                const click = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                });

                const webflow_jquery_toggle = document.querySelector('.toggle-base');
                if (webflow_jquery_toggle) {
                  webflow_jquery_toggle.dispatchEvent(click);
                }
              });
            }}
          >
            {cloneElement(c, { className: '' })}
          </div>
        );
        return (
          <div
            className='relative w-[44px]'
            onClick={() => {
              const click = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
              });

              const webflow_jquery_toggle = document.querySelector('.toggle-base');
              if (webflow_jquery_toggle) {
                webflow_jquery_toggle.dispatchEvent(click);
              }
            }}
          >
            <div className='pointer-events-none'>{React.cloneElement(c)}</div>
            <div className='absolute top-0 left-1 rounded-full bg-red-400 w-full h-full'></div>
          </div>
        );
      }
      return React.cloneElement(
        c,
        c.props,
        <Iterator {...props} agent={agent}>
          {c.props.children}
        </Iterator>,
      );
    }
  });
  return <>{Wrapped}</>;
}

export default function AgentListingsToggle({ className, children, agent }: { className: string; children: React.ReactElement; agent: AgentData }) {
  const { data, fireEvent: toggleAgentOnly } = useEvent(Events.AgentMyListings);
  return (
    <div
      className={classNames(className, 'rexified', 'AgentListingsToggle')}
      data-toggle='agent'
      onClick={evt => {
        evt.stopPropagation();
        toggleAgentOnly({ show: !data?.show });
      }}
    >
      <Iterator agent={agent} {...data}>
        {children}
      </Iterator>
    </div>
  );
}

function RexifyActionButton({ children, ...p }: { children: ReactElement; 'is-toggled'?: boolean }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children) {
      if (typeof c.props.children !== 'string') {
        if (c.type === 'div') {
          const { children: sub, ...attr } = c.props;
          return cloneElement(
            <span />,
            {
              ...attr,
              className: classNames(attr.className || '', attr.className.includes('toggle-base') && p['is-toggled'] ? '' : 'justify-start saturate-0'),
            },
            <RexifyActionButton>{sub}</RexifyActionButton>,
          );
        }
        return cloneElement(c, {}, <RexifyActionButton>{c.props.children}</RexifyActionButton>);
      }
    } else if (c.type === 'div') {
      const { children: sub, ...attr } = c.props;
      return cloneElement(<span />, attr);
    }
    return c;
  });

  return <>{Rexified}</>;
}
export function ActionButton({ children, ...props }: { children: ReactElement }) {
  const toggler = useEvent(Events.AgentMyListings);

  return (
    <button
      className='relative bg-transparent w-16'
      type='button'
      onClick={() => {
        toggler.fireEvent({ show: toggler.data?.show === true ? false : true });
      }}
    >
      <RexifyActionButton is-toggled={toggler.data?.show === true}>{children}</RexifyActionButton>
    </button>
  );
}
