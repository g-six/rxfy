import { Children, ReactElement, cloneElement } from 'react';
import MyListingsListingCard from './listing-card.rexifier';
import { getMostRecentListings } from '@/app/api/agents/model';
import { PropertyDataModel } from '@/_typings/property';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { AgentData } from '@/_typings/agent';
import { getAgentBaseUrl } from '../api/_helpers/agent-helper';

export default async function MyListingsMLSListings({ children, agent, ...props }: { children: ReactElement; className?: string; agent: AgentData }) {
  const properties: { [k: string]: string }[] = [];
  if (agent?.agent_id) {
    const { agent_id } = agent as AgentData;
    const results = await getMostRecentListings(agent_id, 50);
    const listings = results as PropertyDataModel[];

    if (listings && listings.length) {
      let mls_listings = listings as PropertyDataModel[];
      mls_listings = mls_listings
        .filter(l => l)
        .sort((a, b) => {
          if (a.status && b.status) {
            if (a.status < b.status) return -1;
            if (a.status > b.status) return 1;
          }
          return 0;
        });
      if (mls_listings.length) {
        mls_listings.map(l => {
          properties.push({
            mls_id: l.mls_id,
            title: l.title,
            listing_id: l.guid || '',
            area: l.area,
            city: l.city,
            status: l.status || 'Terminated',
            asking_price: formatValues(l, 'asking_price') as string,
            cover_photo: l.photos?.length && l.photos[0].length > 1 ? (getImageSized(l.photos[0], 240) as string) : '',
          });
        });
      }
    }
  }

  return (
    <section {...props} role='list' data-rx='MyListingsMLSListings'>
      {properties?.length ? (
        Children.map(children, ({ props: { children: card_components, ...card_props } }, idx) => {
          return idx === 0 ? (
            <>
              {properties.map(p => (
                <MyListingsListingCard
                  {...card_props}
                  key={`card-for-${p.mls_id}`}
                  listing={{
                    ...p,
                    url: `${getAgentBaseUrl(agent, true)}/property?mls=${p.mls_id}`,
                  }}
                >
                  {card_components}
                </MyListingsListingCard>
              ))}
            </>
          ) : (
            <>{'<!-- end of iterating cards -->'}</>
          );
        })
      ) : (
        <></>
      )}
    </section>
  );
}
