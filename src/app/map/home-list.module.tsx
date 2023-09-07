'use client';

import React from 'react';
import styles from './home-list.module.scss';
import EmptyState from './empty-state.module';
import PropertyCard from './property-card.module';
import { AgentData } from '@/_typings/agent';

function Iterator({ children, ...props }: { agent?: AgentData; children: React.ReactElement }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      if (c.props.className?.includes('is-card') || c.props.className?.split(' ').includes('property-card')) {
        return (
          <PropertyCard {...props} {...c.props}>
            {c.props.children}
          </PropertyCard>
        );
      }
      if (c.props.className?.includes('empty-state')) {
        return <EmptyState {...c.props}>{c.props.children}</EmptyState>;
      }
      return (
        <div className={[c.props.className, 'rexified flex flex-col gap-y-2 childof-HomeList'].join(' ')}>
          <Iterator {...props}>{c.props.children}</Iterator>
        </div>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default function HomeList({ agent, className, children }: { agent?: AgentData; className: string; children: React.ReactElement }) {
  return (
    <div className={[className, styles['list-scroller'], 'rexified', 'HomeList'].join(' ')}>
      <Iterator agent={agent}>{children}</Iterator>
    </div>
  );
}
