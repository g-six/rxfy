import { Children, ReactElement, cloneElement } from 'react';
import { AgentData } from '@/_typings/agent';
import { PrivateListingModel } from '@/_typings/private-listing';
import MyListingsAddressInputComponent from './components/address-input.component';
import RxMapOfListing from '@/components/RxMapOfListing';
import { LatLng } from '@/_typings/agent-my-listings';
import MyListingStreetMap from './components/street-map.component';
import MyListingStreetView from './components/street-view.component';

/**
<RxMapOfListing key={0} 
  child={child.props.children[0]} 
  mapType={MapType.NEIGHBORHOOD} 
  property={coords satisfies LatLng} />
*/
function Rexify({ children, ...data }: { agent: AgentData; listing?: PrivateListingModel; children: ReactElement }) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { children: components, className = '', ...props } = c.props;
      className = `${className}${className && ' '}rexified`;
      if (components && typeof components !== 'string') {
        // Rexify workspace tabs
        if (data.listing?.id) {
          if (className.includes('get-started')) {
            return <></>;
          }
          if (data.listing?.lat && data.listing?.lon) {
            if (className.includes('tab-neighborhood-content'))
              return cloneElement(
                c,
                {
                  className,
                },

                <MyListingStreetMap lat={Number(data.listing.lat)} lon={Number(data.listing.lon)} />,
              );
            if (className.includes('tab-street-content')) {
              return cloneElement(
                c,
                {
                  className,
                },
                <MyListingStreetView lat={Number(data.listing.lat)} lon={Number(data.listing.lon)}>
                  {components}
                </MyListingStreetView>,
              );
            }
          }
        }
        return cloneElement(c, { className }, <Rexify {...data}>{components}</Rexify>);
      }

      if (c.type === 'input') {
        const address = data.listing?.title || '';

        if (className.includes('address-input')) return <MyListingsAddressInputComponent {...props} className={className} address={address} />;
        if (props['data-name']) {
          switch (props['data-name']) {
            case 'Address':
              return cloneElement(c, { defaultValue: data.listing?.title || '' });
            case 'Unit':
              return cloneElement(c, { defaultValue: data.listing?.building_unit || '' });
            case 'City':
              return cloneElement(c, { defaultValue: data.listing?.city || '' });
            case 'Province':
              return cloneElement(c, { defaultValue: data.listing?.state_province || '' });
            case 'Postal Code':
              return cloneElement(c, { defaultValue: data.listing?.postal_zip_code || '' });
            case 'Neighbourhood':
              return cloneElement(c, { defaultValue: data.listing?.neighbourhood || '' });
          }
        }
      }
    }

    return c;
  });
  return <>{Rexified}</>;
}
export default async function MyListingsAddressEditor({ children, ...data }: { agent: AgentData; listing?: PrivateListingModel; children: ReactElement }) {
  return <Rexify {...data}>{children}</Rexify>;
}
