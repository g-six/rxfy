import { Children, ReactElement, ReactNode } from 'react';
import MyListingsListingCard from './listing-card.rexifier';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { AgentData } from '@/_typings/agent';
import { getAgentBaseUrl } from '../api/_helpers/agent-helper';
import { getPrivateListingsByRealtorId } from '../api/private-listings/model';

export default async function MyListingsPrivateListings({ children, agent, ...props }: { children: ReactElement; className?: string; agent: AgentData }) {
  const properties: { [k: string]: string }[] = [];
  if (agent?.id) {
    const listings = await getPrivateListingsByRealtorId(agent.id);
    if (listings && Array.isArray(listings)) {
      listings.map(l => {
        properties.push({
          id: `${l.id || ''}`,
          title: l.title || '',
          area: l.area || '',
          city: l.city || '',
          status: l.status || 'Terminated',
          asking_price: formatValues(l, 'asking_price') as string,
          cover_photo: l.photos?.length ? (getImageSized(l.photos[0], 240) as string) : '',
          url: getAgentBaseUrl(agent, true) + '/property?lid=' + l.id,
        });
      });
    }
  }

  const [listing_card]: ReactElement[] = Children.toArray(children)
    .filter((child: ReactNode) => (child as ReactElement).props?.['data-component'])
    .map(element => element as ReactElement);

  return (
    <section {...props} role='list' data-rx='MyListingsPrivateListings'>
      {properties?.length
        ? properties.map(p =>
            p ? (
              <MyListingsListingCard {...listing_card.props} key={`card-for-${p.id}`} listing={p}>
                {listing_card.props.children}
              </MyListingsListingCard>
            ) : (
              <></>
            ),
          )
        : '<!-- No listings -->'}
    </section>
  );
}
