import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import RxDropMenu from '@/components/RxForms/RxDropMenu';
import React, { ReactElement, cloneElement } from 'react';
import MyListingsCard from './MyListingsCard';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { deletePrivateListing, updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';
import useEvent from '@/hooks/useEvent';
import { convertToRooms } from '@/_helpers/mls-mapper';
type Props = {
  template: ReactElement;
  property: any;
  changeTab: () => void;
  onDelete: () => void;
};

export default function MyListingPrivateCard({ template, property, changeTab, onDelete }: Props) {
  const { fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, {}, true);
  const { fireEvent: fireListingUpdate } = useEvent(Events.AgentMyListings, true);
  const dropdownMatches: tMatch[] = [
    {
      searchFn: searchByClasses(['set-as-draft']),
      transformChild: child => {
        const isDraft = property?.status.toLowerCase() === 'draft';

        return cloneElement(
          child,
          {
            // style: isDraft ? { display: 'none' } : {},
            onClick: () => {
              updatePrivateListing(property.id, { status: !isDraft ? 'draft' : 'active' }).then(res => {
                fireListingUpdate({ metadata: { ...property, ...res } });
              });
            },
          },
          [isDraft ? `Publish` : `Save as Draft`],
        );
      },
    },
    {
      searchFn: searchByClasses(['view-listing']),
      transformChild: child =>
        cloneElement(child, {
          href: property.page_url,
          target: '_blank',
        }),
    },
    {
      searchFn: searchByClasses(['edit-listing']),
      transformChild: child =>
        cloneElement(child, {
          onClick: () => {
            changeTab();
            fireEvent({ ...property, ...convertToRooms(property?.room_details), ...convertToRooms(property?.bathroom_details), noMerge: true });
          },
        }),
    },
    {
      searchFn: searchByClasses(['delete-listing']),
      transformChild: child =>
        cloneElement(child, {
          onClick: () => {
            deletePrivateListing(property.id).then(onDelete);
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
            wrapperStyle={{ zIndex: 'unset' }}
            // toggleStyle={{ zIndex: 'unset' }}
            menuRenderer={(child: ReactElement) => {
              return (
                <nav className={`${child.props.className} w--open w-max min-w-max`} style={{ display: 'block', zIndex: 'unset' }}>
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
