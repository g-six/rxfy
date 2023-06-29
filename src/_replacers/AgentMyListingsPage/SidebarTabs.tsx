import { removeKeys, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { removeClasses } from '@/_helpers/functions';
import { convertPrivateListingToPropertyData } from '@/_helpers/mls-mapper';
import { PageTabs } from '@/_typings/agent-my-listings';
import { updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import useEvent from '@/hooks/useEvent';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import React, { Dispatch, ReactElement, SetStateAction, createElement } from 'react';

type Props = {
  template: ReactElement;
  currentTab: PageTabs;
  setCurrentTab: Dispatch<SetStateAction<PageTabs>>;
  prepareForm: () => void;
};

export default function SidebarTabs({ template, currentTab, setCurrentTab, prepareForm }: Props) {
  const { data }: { data?: PrivateListingData } = useFormEvent(Events.PrivateListingForm);

  const { fireEvent: fireListingUpdate } = useEvent(Events.AgentMyListings, true);
  const updateDataAndBack = () => {
    data &&
      updatePrivateListing(data.id as unknown as number, convertPrivateListingToPropertyData(data)).then(res => {
        fireListingUpdate({ metadata: res satisfies PrivateListingData });
        setCurrentTab('my-listings');
      });
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['my-listings']),
      transformChild: child => {
        return createElement(
          'a',
          {
            className: `${removeClasses(child.props.className, ['w--current'])} ${currentTab === 'my-listings' ? 'w--current' : ''}`,
            onClick: () => {
              updateDataAndBack();
            },
          },
          [child.props.children],
        );
      },
    },
    {
      searchFn: searchByClasses(['new-listing']),
      transformChild: child =>
        createElement(
          child.type,
          {
            ...removeKeys(child.props, ['id']),
            className: `${removeClasses(child.props.className, ['w--current'])} ${currentTab === 'private-listing' ? 'w--current' : ''}`,
            onClick: () => {
              setCurrentTab('my-listings');
              prepareForm();
            },
          },
          [child.props.children],
        ),
    },
  ];
  return transformMatchingElements(template, matches) as ReactElement;
}
