import { Children, ReactElement, cloneElement } from 'react';
import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import HeartButton from './heart-button.module';
import styles from './profile-page.module.scss';

export function PropertyCard({ agent, listing, children }: { agent: AgentData; listing: PropertyDataModel; children: ReactElement }) {
  const Wrapped = Children.map(children, c => {
    if (c.props?.className?.includes('heart-')) {
      return (
        <HeartButton {...c.props} agent={agent} listing={listing} className={classNames(c.props.className, styles['heart-button'])}>
          {c.props.children}
        </HeartButton>
      );
    }
    if (c.type === 'div' && (c.props?.['data-group'] === 'listing_info' || c.props?.['data-field'] === undefined)) {
      const { children: sub, className: containerClassName, ...props } = c.props;
      return (
        <div {...props} className={classNames(containerClassName)}>
          <PropertyCard agent={agent} listing={listing}>
            {sub}
          </PropertyCard>
          {c.props?.['data-group'] === 'listing_info' && (
            <a
              href={(agent.domain_name ? '' : `/${agent.agent_id}/${agent.metatags.profile_slug}`) + `/property?mls=${listing.mls_id}`}
              className='absolute top-0 left-0 w-full h-full z-[1]'
            />
          )}
        </div>
      );
    }
    if (c.type === 'img' && listing) {
      if (c.props.className.includes('property-card-image'))
        return (
          <div
            key={listing.mls_id}
            className={styles.CoverPhoto}
            style={{
              backgroundImage: `url(/house-placeholder.png)`,
            }}
          >
            <div
              key={listing.mls_id}
              className={classNames(styles.CoverPhoto, `${listing.status?.toLowerCase()}-listing`, styles[`${listing.status?.toLowerCase()}-listing`])}
              style={{
                backgroundImage: `url(${
                  listing.cover_photo ? getImageSized(listing.cover_photo, listing.status?.toLowerCase() === 'sold' ? 720 : 646) : '/house-placeholder.png'
                })`,
              }}
            />
            <a
              href={(agent.domain_name ? '' : `/${agent.agent_id}/${agent.metatags.profile_slug}`) + `/property?mls=${listing.mls_id}`}
              className='absolute top-0 left-0 w-full h-full'
            />
          </div>
        );
      else if (c.props.className.includes('propcard-image') && listing.cover_photo) {
        return (
          <div>
            <img
              key={listing.mls_id}
              className={c.props.className}
              src={getImageSized(listing.cover_photo, listing.status?.toLowerCase() === 'sold' ? 720 : 646)}
            />

            <a
              href={(agent.domain_name ? '' : `/${agent.agent_id}/${agent.metatags.profile_slug}`) + `/property?mls=${listing.mls_id}`}
              className='w-full h-full flex flex-col absolute top-0 left-0'
            ></a>
          </div>
        );
      } else if (c.props['data-field'] === 'cover_photo' && listing.cover_photo) {
        return cloneElement(c, { src: getImageSized(listing.cover_photo, 540), srcSet: undefined });
      }
    }
    if (c.type === 'img' && c.props.className.includes('agentface')) {
      return (
        <div
          className={classNames('w-[48px] h-[48px] bg-cover bg-center overflow-hidden bg-no-repeat block')}
          style={{
            backgroundImage: `url(${c.props.src})`,
          }}
        >
          <div
            className={classNames('w-[48px] h-[48px] bg-cover bg-center overflow-hidden bg-no-repeat block')}
            style={{
              backgroundImage: `url(${getImageSized(agent.metatags.headshot || '/house-placeholder.png', 128 * 2)})`,
            }}
          />
        </div>
      );
    }
    if (c.props && c.props['data-field']) {
      switch (c.props['data-field']) {
        case 'address':
        case 'property_address':
          return cloneElement(c, c.props, listing.title);
        case 'area':
          return cloneElement(c, c.props, listing.area || listing.city);
        case 'year-built':
          return cloneElement(c, c.props, listing.year_built);
        case 'beds':
          return cloneElement(c, c.props, listing.beds);
        case 'baths':
          return cloneElement(c, c.props, listing.baths);
        case 'year_built':
          return cloneElement(c, c.props, listing.year_built);
        case 'sqft':
          return cloneElement(c, c.props, formatValues(listing, 'floor_area'));
        case 'property-price':
        case 'asking_price':
          return cloneElement(c, c.props, formatValues(listing, 'asking_price'));
        default:
          return cloneElement(c, c.props, formatValues(listing, c.props['data-field']));
      }
    }
    return c;
  });

  return <>{Wrapped}</>;
}
