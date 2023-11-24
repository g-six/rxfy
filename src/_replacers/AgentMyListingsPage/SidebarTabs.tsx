import { removeKeys, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { removeClasses } from '@/_helpers/functions';
import { PageTabs } from '@/_typings/agent-my-listings';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import useEvent from '@/hooks/useEvent';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { Dispatch, ReactElement, SetStateAction, createElement } from 'react';

type Props = {
  template: ReactElement;
  currentTab: PageTabs;
  setCurrentTab: Dispatch<SetStateAction<PageTabs>>;
};

export default function SidebarTabs({ template, currentTab, setCurrentTab }: Props) {
  const { data, fireEvent }: { data?: PrivateListingData; fireEvent: (data: PrivateListingData) => void } = useFormEvent(Events.PrivateListingForm);
  const { fireEvent: fireListingUpdate } = useEvent(Events.AgentMyListings, true);
  const updateDataAndBack = () => {
    setCurrentTab('my-listings');
    return;
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
              if (data?.id) updateDataAndBack();
              else {
                document.querySelector('.my-listings-tab-content')?.classList.add('w--tab-active');
                document.querySelector('.tab-pane-private-listings')?.classList.remove('w--tab-active');
                setCurrentTab('my-listings');
              }
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
              if (data) {
                let new_data = {};
                Object.keys(data).forEach(k => {
                  new_data = {
                    ...new_data,
                    [k]: null,
                  };
                });
                fireEvent(new_data);
              }
              // setCurrentTab('private-listing');
              document.querySelector('.my-listings-tab-content')?.classList.remove('w--tab-active');
              document.querySelector('.tab-pane-private-listings')?.classList.add('w--tab-active');
            },
          },
          [child.props.children],
        ),
    },
  ];
  return transformMatchingElements(template, matches) as ReactElement;
}
