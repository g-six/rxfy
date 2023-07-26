'use client';

import React from 'react';
import styles from './home-list.module.scss';
import EmptyState from './empty-state.module';
import PropertyCard from './property-card.module';
import { useRouter } from 'next/navigation';
import useEvent, { Events } from '@/hooks/useEvent';

function Iterator({ children }: { children: React.ReactElement }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      if (c.props.className.includes('property-card')) {
        return <PropertyCard {...c.props}>{c.props.children}</PropertyCard>;
      }
      if (c.props.className.includes('empty-state')) {
        return <EmptyState {...c.props}>{c.props.children}</EmptyState>;
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
  const router = useRouter();

  React.useEffect(() => {
    console.log({ data });
  }, []);

  return (
    <div className={[className, styles['list-scroller'], 'rexified', 'HomeList'].join(' ')}>
      <Iterator>{children}</Iterator>
    </div>
  );
}
