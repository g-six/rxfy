'use client';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import RxDropMenu from '@/components/RxForms/RxDropMenu';
import React, { ReactElement, cloneElement } from 'react';
import MyListingsCard from './MyListingsCard';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
type Props = {
  template: ReactElement;
  property: any;
  changeTab: () => void;
};

export default function MyListingPrivateCard({ template, property, changeTab }: Props) {
  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  const dropdownMatches: tMatch[] = [
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
