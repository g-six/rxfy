'use client';

import React from 'react';
import styles from './home-list.module.scss';
import EmptyState from './empty-state.module';
import PropertyCard from './property-card.module';
import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';
import useEvent, { Events } from '@/hooks/useEvent';
import { consoler } from '@/_helpers/consoler';

const FILE = 'app/map/home-list.module.tsx';

interface Props {
  agent?: AgentData;
  children: React.ReactElement;
  properties: PropertyDataModel[];
}

function Iterator({ children, ...props }: Props) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      if (c.props['data-component'] === 'property_card') {
        return (
          <PropertyCard {...props} {...c.props}>
            {c.props.children}
          </PropertyCard>
        );
      }
      if (c.props?.className?.includes('empty-state')) {
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

export default function HomeList({ className, children, ...props }: Props & { className: string }) {
  const evt = useEvent(Events.MapSearch);
  const { points } = evt.data as unknown as {
    points?: {
      // properties here relates to the map points (pin properties)
      // not to be confused with an array of listings
      properties: PropertyDataModel;
    }[];
  };
  const properties: PropertyDataModel[] = points ? points.map(p => p.properties) : [];

  return (
    <div className={[className, styles['list-scroller'], 'rexified', 'HomeList'].join(' ')}>
      <Iterator {...props} properties={properties}>
        {children}
      </Iterator>
    </div>
  );
}
