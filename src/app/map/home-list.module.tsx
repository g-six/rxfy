'use client';

import React from 'react';
import styles from './home-list.module.scss';
import EmptyState from './empty-state.module';
import PropertyCard from './property-card.module';
import useEvent, { Events } from '@/hooks/useEvent';
import { PropertyDataModel } from '@/_typings/property';

function Iterator({ children, ...props }: { children: React.ReactElement; 'is-empty'?: boolean }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      if (c.props.className.includes('property-card')) {
        return <PropertyCard {...c.props}>{c.props.children}</PropertyCard>;
      }
      if (c.props.className.includes('empty-state')) {
        return props['is-empty'] ? <EmptyState {...c.props}>{c.props.children}</EmptyState> : <></>;
      }
      return (
        <div className={[c.props.className, 'rexified childof-HomeList'].join(' ')}>
          <Iterator>{c.props.children}</Iterator>
        </div>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default function HomeList({ className, children }: { className: string; children: React.ReactElement }) {
  const { data } = useEvent(Events.MapSearch);
  const [is_empty, setToEmpty] = React.useState(false);

  React.useEffect(() => {
    const { points } = data as unknown as {
      points: {
        properties: PropertyDataModel;
      }[];
    };
    setToEmpty(!points || points.length === 0);
  }, [data]);

  return (
    <div className={[className, styles['list-scroller'], 'rexified', 'HomeList'].join(' ')}>
      <Iterator is-empty={is_empty}>{children}</Iterator>
    </div>
  );
}
