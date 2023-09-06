import React from 'react';
import useEvent, { Events } from '@/hooks/useEvent';
import { useRouter } from 'next/navigation';

import styles from './home-list.module.scss';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import LoveButton from './love-button.module';
import { PropertyDataModel } from '@/_typings/property';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

function PropertyCardIterator({ children, listing, onClickToOpen }: { children: React.ReactElement; listing: PropertyDataModel; onClickToOpen(): void }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'img' && listing.cover_photo && c.props.className?.includes('propcard-image')) {
      return React.cloneElement(c, {
        ...c.props,
        srcSet: undefined,
        src: getImageSized(listing.cover_photo, 520),
      });
    } else if (c.type === 'div') {
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

      if (c.props.className.includes('area-text') || c.props['data-field'] === 'area') {
        return <div {...c.props}>{listing.area}</div>;
      }
      if (c.props.className.includes('propcard-price') || c.props['data-field'] === 'asking_price') {
        return <div {...c.props}>{formatValues(listing, 'asking_price')}</div>;
      }
      if (c.props.className.includes('propcard-address') || c.props['data-field'] === 'title') {
        return <div {...c.props}>{listing.title}</div>;
      }
      if (c.props.className.includes('bedroom-stat') || c.props['data-field'] === 'beds') {
        return <div {...c.props}>{listing.beds}</div>;
      }
      if (c.props.className.includes('bath-stat') || c.props['data-field'] === 'baths') {
        return <div {...c.props}>{listing.baths}</div>;
      }
      if (c.props.className.includes('sqft-stat') || c.props['data-field'] === 'sqft') {
        return <div {...c.props}>{formatValues(listing, 'floor_area')}</div>;
      }
      if (c.props.className.includes('year-stat') || c.props['data-field'] === 'year_built') {
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

  const router = useRouter();

  const { data } = useEvent(Events.MapSearch);
  const { points, reload } = data as unknown as {
    points: {
      properties: PropertyDataModel;
    }[];
    reload: boolean;
  };

  const [cards, setCards] = React.useState<React.ReactElement[]>([]);

  React.useEffect(() => {
    if (points)
      setCards(
        points
          .filter(p => {
            return p.properties.cover_photo;
          })
          .slice(0, 100)
          .map(({ properties: p }) => (
            <div key={p.mls_id} className={[className, p.mls_id, ' rexified HomeList-PropertyCard relative'].join(' ')}>
              <PropertyCardIterator
                listing={p}
                onClickToOpen={() => {
                  router.push('property?mls=' + p.mls_id);
                }}
              >
                {children}
              </PropertyCardIterator>
              <a href={`property?mls=${p.mls_id}`} className='absolute top-0 left-0 h-full w-full z-20' />
            </div>
          )),
      );
  }, [points]);

  return <>{cards.length > 0 && cards}</>;
}
