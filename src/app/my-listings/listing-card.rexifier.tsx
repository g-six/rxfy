import { formatValues } from '@/_utilities/data-helpers/property-page';
import { Children, ReactElement, cloneElement } from 'react';
import MLSLinkComponent from './mls-link.component';

function Rexified({ children, listing, ...props }: { children: ReactElement; listing: Record<string, string> }) {
  const rexified = Children.map(children, c => {
    if (c.props?.className?.includes('propcard-image') && listing.cover_photo) {
      return cloneElement(c, {
        style: {
          backgroundImage: `url(${listing.cover_photo})`,
        },
      });
    }
    if (c.props?.['data-field']) {
      if (Object.keys(listing).includes(c.props['data-field'])) {
        // We have custom status CSS
        let className = `${c.props.className || ''} rexified`;
        if (c.props['data-field'] === 'status') {
          className = `${className
            .split(' ')
            .filter(name => !name.includes('status-'))
            .join(' ')} capitalize status-${listing[c.props['data-field']].toLowerCase()}`;
        }
        return cloneElement(c, { 'data-rx': c.props['data-field'], className }, listing[c.props['data-field']] || <></>);
      }
      if (c.props['data-field'] === 'address') {
        const { state_province, postal_zip_code, title, city } = listing;
        let address = formatValues(
          {
            address: listing.title,
          },
          'address',
        );
        if (title.includes(`, ${city}`)) {
          address =
            formatValues(
              {
                address: title.split(', ')[0],
              },
              'address',
            ) + `${title.split(', ').length > 1 ? ', ' : ''}${title.split(', ').slice(1).join(', ')}`;
        }
        return cloneElement(
          c,
          {
            style: {
              minWidth: '180px',
            },
            'data-rx': 'title',
          },
          <>{address}</>,
        );
      }
    }
    // Action buttons
    if (c.props?.['data-action']) {
      const { children: contents, ...link_props } = c.props;
      switch (c.props['data-action']) {
        case 'view_listing':
          return listing.mls_id ? (
            <MLSLinkComponent {...link_props} mls_id={listing.mls_id} href={listing.url}>
              {contents}
            </MLSLinkComponent>
          ) : (
            cloneElement(c, { href: listing.url, target: '_blank' })
          );
        case 'edit':
          return cloneElement(c, { href: `/my-listings?id=${listing.id}` });
      }
    }

    if (c.props?.children && typeof c.props.children !== 'string') {
      return cloneElement(c, {}, <Rexified listing={listing}>{c.props.children}</Rexified>);
    }
    return c;
  });
  return <>{rexified}</>;
}

export default async function MyListingsListingCard({
  children,
  listing,
  ...props
}: {
  children: ReactElement;
  className?: string;
  listing: Record<string, string>;
}) {
  return (
    <div data-rx='MyListingsListingCard' {...props}>
      <Rexified listing={listing}>{children}</Rexified>
    </div>
  );
}
