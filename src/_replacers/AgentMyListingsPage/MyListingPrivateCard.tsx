import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import RxDropMenu from '@/components/RxForms/RxDropMenu';
import React, { ReactElement, cloneElement } from 'react';
import MyListingsCard from './MyListingsCard';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';
import useEvent from '@/hooks/useEvent';
type Props = {
  template: ReactElement;
  property: any;
  changeTab: () => void;
};

export default function MyListingPrivateCard({ template, property, changeTab }: Props) {
  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  const { fireEvent: fireListingUpdate } = useEvent(Events.AgentMyListings, true);
  const dropdownMatches: tMatch[] = [
    {
      searchFn: searchByClasses(['set-as-draft']),
      transformChild: child => {
        const isDraft = property?.status.toLowerCase() === 'draft';

        return cloneElement(child, {
          style: isDraft ? { display: 'none' } : {},
          onClick: () => {
            updatePrivateListing(property.id, { status: 'draft' }).then(() => {
              fireListingUpdate({ metadata: { ...property, status: 'draft' } });
            });
          },
        });
      },
    },
    {
      searchFn: searchByClasses(['edit-listing']),
      transformChild: child =>
        cloneElement(child, {
          onClick: () => {
            fireEvent({ ...property });
            changeTab();
          },
        }),
    },
  ];

  const privateMatches: tMatch[] = [
    {
      searchFn: searchByClasses(['my-listing-dropdown']),
      transformChild: child => {
        return (
          <RxDropMenu
            wrapperNode={child}
            menuClassNames={['dropdown-list']}
            toggleClassNames={['dropdown-toggle', 'w-dropdown-toggle']}
            menuRenderer={(child: ReactElement) => {
              return (
                <nav className={`${child.props.className} w--open w-max min-w-max`} style={{ display: 'block' }}>
                  {transformMatchingElements(child.props.children, dropdownMatches)}
                </nav>
              ) as ReactElement;
            }}
          />
        );
      },
    },
  ];
  const transformed = transformMatchingElements(template, privateMatches) as ReactElement;
  return <MyListingsCard template={transformed} property={property} />;
}
