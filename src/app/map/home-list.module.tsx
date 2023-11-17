'use client';

import React, { useEffect, useState } from 'react';
import styles from './home-list.module.scss';
import EmptyState from './empty-state.module';
import PropertyCard from './property-card.module';
import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';
import useEvent, { Events } from '@/hooks/useEvent';

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

export default function HomeList({ className, children, properties: initial_points, ...props }: Props & { className: string }) {
  const evt = useEvent(Events.MapSearch);
  const [properties, setProperties] = useState<PropertyDataModel[]>(initial_points);

  useEffect(() => {
    if (evt.data) {
      const search = evt.data as unknown as {
        points?: {
          properties: PropertyDataModel;
        }[];
      };
      if (search.points) {
        setProperties(search.points.map(p => p.properties));
      } else {
        setProperties([]);
      }
    }
  }, [evt.data]);

  return (
    <div className={[className, styles['list-scroller'], 'rexified', 'HomeList'].join(' ')}>
      <Iterator {...props} properties={properties}>
        {children}
      </Iterator>
    </div>
  );
}
