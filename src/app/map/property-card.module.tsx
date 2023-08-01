import React from 'react';
import useEvent, { Events } from '@/hooks/useEvent';
import { useRouter } from 'next/navigation';

import styles from './home-list.module.scss';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import LoveButton from './love-button.module';
import { PropertyDataModel } from '@/_typings/property';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';

function PropertyCardIterator({ children, listing, onClickToOpen }: { children: React.ReactElement; listing: PropertyDataModel; onClickToOpen(): void }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      if (c.props.className.includes('propcard-image')) {
        return (
          <div className={[c.props.className, 'relative', 'rexified', 'HomeList-PropertyCardIterator'].join(' ')}>
            <div
              className={styles['cover-photo']}
              style={{
                backgroundImage: `url(${listing.cover_photo})`,
              }}
              onClick={onClickToOpen}
            />
            <PropertyCardIterator listing={listing} onClickToOpen={onClickToOpen}>
              {c.props.children}
            </PropertyCardIterator>
          </div>
        );
      }

      if (c.props.className.includes('area-text')) {
        return <div {...c.props}>{listing.area}</div>;
      }
      if (c.props.className.includes('propcard-price')) {
        return <div {...c.props}>{formatValues(listing, 'asking_price')}</div>;
      }
      if (c.props.className.includes('propcard-address')) {
        return <div {...c.props}>{listing.title}</div>;
      }
      if (c.props.className.includes('bedroom-stat')) {
        return <div {...c.props}>{listing.beds}</div>;
      }
      if (c.props.className.includes('bath-stat')) {
        return <div {...c.props}>{listing.baths}</div>;
      }
      if (c.props.className.includes('sqft-stat')) {
        return <div {...c.props}>{formatValues(listing, 'floor_area')}</div>;
      }
      if (c.props.className.includes('year-stat')) {
        return <div {...c.props}>{listing.year_built}</div>;
      }
      if (c.props.className.includes('heart-full')) {
        return (
          <LoveButton listing={listing} className={c.props.className}>
            {c.props.children}
          </LoveButton>
        );
      }
      return (
        <div
          className={c.props.className + ' rexified z-10'}
          onClick={() => {
            if (c.props.className.includes('propcard-details')) {
              onClickToOpen();
            }
          }}
        >
          <PropertyCardIterator listing={listing} onClickToOpen={onClickToOpen}>
            {c.props.children}
          </PropertyCardIterator>
        </div>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default function PropertyCard({ className, children }: { className: string; children: React.ReactElement }) {
  const { data: love } = useEvent(Events.MapLoversToggle);
  const { loved_only } = love as unknown as {
    loved_only: boolean;
  };
  const loves = getData(Events.LovedItem) as unknown as string[];

  const router = useRouter();
  const { data } = useEvent(Events.MapSearch);
  const [cards, setCards] = React.useState<React.ReactElement[]>([]);
  React.useEffect(() => {
    const { points, reload } = data as unknown as {
      points: {
        properties: PropertyDataModel;
      }[];
      reload: boolean;
    };

    if (points && reload === false) {
      if (loved_only && !loves) {
        setCards([]);
      } else
        setCards(
          points
            .filter(p => {
              if (loved_only) {
                return loves ? loves.includes(p.properties.mls_id) : [];
              }
              return p.properties.cover_photo;
            })
            .slice(0, 100)
            .map(({ properties: p }) => (
              <div key={p.mls_id} className={[className, p.mls_id, 'cursor-pointer rexified HomeList-PropertyCard'].join(' ')}>
                <PropertyCardIterator
                  listing={p}
                  onClickToOpen={() => {
                    router.push('property?mls=' + p.mls_id);
                  }}
                >
                  {children}
                </PropertyCardIterator>
              </div>
            )),
        );
    }
  }, [data, loved_only]);

  return <>{cards.length > 0 && cards}</>;
}
