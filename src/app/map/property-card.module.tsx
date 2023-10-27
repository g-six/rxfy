import React, { ReactElement, cloneElement } from 'react';
import useEvent, { Events } from '@/hooks/useEvent';
import { useRouter } from 'next/navigation';

import styles from './home-list.module.scss';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import LoveButton from './love-button.module';
import { PropertyDataModel } from '@/_typings/property';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { classNames } from '@/_utilities/html-helper';
import useLove from '@/hooks/useLove';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { AgentData } from '@/_typings/agent';

export function isEmptyHeart(props: { className: string; 'data-field': string }) {
  return props.className?.indexOf('heart-full') >= 0 || props['data-field'] === 'heart_empty';
}
export function isFullHeart(props: { className: string; 'data-field': string }) {
  return props.className?.indexOf('heart-full') >= 0 || props['data-field'] === 'heart_full';
}

function CoverPhotoContainerIterator({
  children,
  ...props
}: {
  children: React.ReactElement;
  listing: PropertyDataModel;
  loved?: boolean;
  onLoveItem(): void;
  onUnloveItem(): void;
}) {
  const Wrapped = React.Children.map(children, c => {
    if (c.props) {
      if (c.props.children) {
        if (c.props['data-field'] === 'area') {
          return cloneElement(c, {}, props.listing.area);
        }
        if (isFullHeart(c.props)) {
          return cloneElement(c, {
            className: classNames(
              c.props.className || 'no-default-class',
              props.loved ? 'hover:opacity-0 opacity-100' : 'hover:opacity-100 opacity-0',
              'cursor-pointer',
            ),
            onClick: (e: React.SyntheticEvent) => {
              e.stopPropagation();
              if (e.currentTarget.classList.contains('opacity-0')) {
                e.currentTarget.classList.remove('opacity-0');
                e.currentTarget.classList.add('opacity-100');
                e.currentTarget.classList.remove('hover:opacity-100');
                e.currentTarget.classList.add('hover:opacity-0');
              } else {
                e.currentTarget.classList.remove('opacity-100');
                e.currentTarget.classList.add('opacity-0');
                e.currentTarget.classList.remove('hover:opacity-0');
                e.currentTarget.classList.add('hover:opacity-100');
              }
              if (props.loved) {
                props.onUnloveItem();
              } else {
                props.onLoveItem();
              }
            },
          });
        }
        if (isEmptyHeart(c.props)) {
          return cloneElement(c, {
            className: classNames(c.props.className || 'no-default-class', 'group-hover:opacity-100', 'opacity-0'),
          });
        }
        if (typeof c.props.children !== 'string')
          return cloneElement(
            c,
            {},
            <CoverPhotoContainerIterator key={props.listing.mls_id} {...props}>
              {c.props.children}
            </CoverPhotoContainerIterator>,
          );
      }
    }
    return c;
  });
  return <>{Wrapped}</>;
}
export function PropertyCardIterator({
  children,
  listing,
  onClickToOpen,
  ...props
}: {
  children: React.ReactElement;
  listing: PropertyDataModel;
  onClickToOpen(): void;
  loved?: boolean;
  onLoveItem(): void;
  onUnloveItem(): void;
}) {
  // e.g /agent-id/profile-slug/map
  const Wrapped = React.Children.map(children, c => {
    if (c.props?.className?.includes('propcard-image')) {
      // e.g. map
      if (listing.cover_photo) {
        if (c.type === 'img')
          return (
            <>
              {React.cloneElement(c, {
                ...c.props,
                srcSet: undefined,
                src: getImageSized(listing.cover_photo, 520),
              })}
              <a href={`property?mls=${listing.mls_id}`} className='h-full w-full absolute z-20 left-0 top-0' />
            </>
          );

        let contents: ReactElement[] = [
          <div key='link' className='h-full w-full absolute left-0 top-0'>
            <a href={`property?mls=${listing.mls_id}`} className='h-full w-full absolute left-0 top-0' />,
          </div>,
        ];
        if (c.props?.children) {
          contents = contents.concat(
            <CoverPhotoContainerIterator key={listing.mls_id} {...props} listing={listing}>
              <>{(c.props.children as ReactElement[]).filter(cc => cc.type !== 'img')}</>
            </CoverPhotoContainerIterator>,
          );
        }
        return React.cloneElement(
          c,
          {
            ...c.props,
            className: classNames(c.props.className || 'no-default-class', 'group', 'relative'),
            style: {
              backgroundImage: `url(${getImageSized(listing.cover_photo, 520)}`,
            },
          },
          contents,
        );
      }
    } else if (c.type === 'div') {
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
          <PropertyCardIterator {...props} listing={listing} onClickToOpen={onClickToOpen}>
            {c.props.children}
          </PropertyCardIterator>
        </div>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default function PropertyCard({ agent, className, children }: { agent?: AgentData; className: string; children: React.ReactElement }) {
  const { data: love } = useEvent(Events.MapLoversToggle);
  const evt = useLove();
  const { loved_only } = love as unknown as {
    loved_only: boolean;
  };
  const router = useRouter();
  const [loved_items, setLovedItems] = React.useState((getData(Events.LovedItem) as unknown as string[]) || []);

  const { data } = useEvent(Events.MapSearch);
  const { points, reload } = data as unknown as {
    points: {
      properties: PropertyDataModel;
    }[];
    reload: boolean;
  };

  const [cards, setCards] = React.useState<React.ReactElement[]>([]);

  const toggleLoved = (listing: PropertyDataModel) => {
    const last = (getData(Events.LovedItem) as unknown as string[]) || [];
    if (!loved_items.includes(listing.mls_id)) {
      setLovedItems(last.concat([listing.mls_id]));
      if (agent?.id) {
        evt.fireEvent(
          {
            ...listing,
            love: 0,
          },
          agent.id,
        );
      }
    } else {
      setLovedItems(last.filter(i => i !== listing.mls_id));
      if (agent?.id) {
        evt.fireEvent(
          {
            ...listing,
            love: 0,
          },
          agent.id,
          true,
        );
      }
    }
  };

  React.useEffect(() => {
    const url = new URL(location.href);
    // e.g /agent-id/profile-slug/map
    const segments = url.pathname.split('/');
    // e.g. map
    segments.pop();
    if (points)
      setCards(
        points
          .filter(p => {
            return p.properties.cover_photo;
          })
          .slice(0, 100)
          .map(({ properties: p }) => (
            <div key={p.mls_id} className={[className, p.mls_id, ' rexified HomeList-PropertyCard'].join(' ')}>
              <PropertyCardIterator
                listing={p}
                loved={loved_items && loved_items.includes(p.mls_id)}
                onLoveItem={() => {
                  if (agent?.id) {
                    toggleLoved(p);
                  }
                }}
                onUnloveItem={() => {
                  if (agent) {
                    toggleLoved(p);
                  }
                }}
                onClickToOpen={() => {
                  // axios
                  //     location.href = `${segments.join('/')}/property?mls=${p.mls_id}`;
                  //   .get(`/api/properties/mls-id/${p.mls_id}`)
                  //   .then(r => {
                  //     // Fix the application error for properties not imported yet
                  //     location.href = `${segments.join('/')}/property?mls=${p.mls_id}`;
                  //   })
                  //   .catch(console.error);
                  // router.push('property?mls=' + p.mls_id);
                }}
              >
                {children}
              </PropertyCardIterator>
            </div>
          )),
      );
  }, [points]);

  return <>{cards.length > 0 && cards}</>;
}
