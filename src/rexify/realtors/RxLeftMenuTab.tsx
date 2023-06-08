'use client';
import React from 'react';
import styles from './RxLeftMenuTab.module.scss';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';

export default function RxLeftMenuTab(p: React.ReactElement) {
  const { data, fireEvent } = useEvent(Events.DashboardMenuTab);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget.dataset.wTab) {
      const active = document.querySelector('[data-w-tab].tab-pane.w--tab-active');
      const active_tab = document.querySelector('[data-w-tab].w-tab-link.w--current');
      if (active) {
        active.setAttribute(
          'class',
          active.className
            .split(' ')
            .filter(n => n.indexOf('w--tab-active') === -1)
            .join(' '),
        );
      }
      if (active_tab) {
        active_tab.setAttribute(
          'class',
          active_tab.className
            .split(' ')
            .filter(n => n.indexOf('w--current') === -1)
            .join(' '),
        );
      }
      const next_active = document.querySelector(`[data-w-tab="${e.currentTarget.dataset.wTab}"].tab-pane`);
      const next_active_tab = document.querySelector(`[data-w-tab="${e.currentTarget.dataset.wTab}"].w-tab-link`);
      if (next_active) {
        next_active.setAttribute('class', next_active.className + ' w--tab-active');
      }
      if (next_active_tab) {
        next_active_tab.setAttribute('class', next_active_tab.className + ' w--current');
      }
      fireEvent({
        ...data,
        tab: e.currentTarget.dataset.wTab,
      } as unknown as EventsData);
    }
  };
  if (p.props.style) {
    p.props.style = undefined;
    console.log('p.props.style', p.props.style);
  }
  if (p.type === 'a') {
    return (
      <div {...p.props} onClick={handleClick} className={p.props.className + ' ' + styles.RxLeftMenuTab}>
        {React.Children.map(p.props.children, RxLeftMenuTab)}
      </div>
    );
  } else {
    return <>{p}</>;
  }
}
