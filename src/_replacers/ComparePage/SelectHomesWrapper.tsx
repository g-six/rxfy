import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { useSearchPopup } from '@/hooks/useSearchPopup';
import { searchByClasses, searchById } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, useState, useEffect, cloneElement, SyntheticEvent, createElement } from 'react';
import { MLSPropertyExtended } from '@/_typings/filters_compare';
import AddhomeCard from './AddhomeCard';
import { Dispatch, SetStateAction } from 'react';
import { mapStrAddress } from '@/_helpers/mls-mapper';
type Props = {
  setProperties: Dispatch<SetStateAction<MLSPropertyExtended[]>>;
  child: ReactElement;
  items: MLSPropertyExtended[];
  config?: {
    authorization: string;
    url: string;
  };
  dataset: {
    [key: string]: string;
  };
};

export default function SelectHomesWrapper({ setProperties, items, child, config }: Props) {
  const [show, setShow] = useState(false);
  const [templates, setTemplates] = useState<Record<string, React.ReactElement>>({});
  const [searched, setSearched] = React.useState(false);
  const hook = useSearchPopup({
    items,
    handleClose: () => {
      setShow(false);
    },
    dataset: {},
    config,
  });
  const templatesToFind = [
    {
      elementName: 'card',
      searchFn: searchByClasses(['property-card-template']),
    },
    {
      elementName: 'input',

      searchFn: searchByClasses(['compare-search-input']),
    },
  ];

  useEffect(() => {
    document.addEventListener(
      'add-homes-click',
      () => {
        setShow(true);
      },
      false,
    );

    setTemplates(captureMatchingElements(child, templatesToFind));
    return () => {
      document.removeEventListener('add-homes-click', () => {});
    };
  }, []);

  const matches = [
    {
      //adding ability to show/hide whole add home modal
      searchFn: searchById('modal-compare-add-homes'),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          style: { display: show ? 'flex' : 'none' },
        });
      },
    },
    {
      // closes modal when click on modals  backdrop
      searchFn: searchByClasses(['add-homes-background']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            setShow(false);
          },
        });
      },
    },
    {
      // close icon
      searchFn: searchByClasses(['close-icon']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          onClick: (e: SyntheticEvent) => {
            setShow(false);
          },
        });
      },
    },
    {
      // replacing search container with new input instead of form
      searchFn: searchById('email-form-4'),
      transformChild: (child: React.ReactElement) => {
        return createElement('div', { className: child.props.className }, child.props.children);
      },
    },
    {
      // replacing search container with new input instead of form
      searchFn: searchByClasses(['compare-search-input']),
      transformChild: (child: React.ReactElement) => {
        const newProps = {
          className: templates?.input?.props.className || '',
          type: 'text',
          value: hook.searchInfo.text,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearched(false);
            hook.setSearchInfo({ ...hook.searchInfo, text: e.currentTarget.value });
          },
          onKeyUp: (e: KeyboardEvent) => {
            if (e.keyCode === 13) {
              setSearched(true);
            }
          },
        };

        return cloneElement(child, { ...newProps });
      },
    },
    {
      // replacing search container with new input instead of form
      searchFn: searchByClasses(['compare-search-reset']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          ...child.props,
          onClick: () => {
            hook.setSearchInfo({ ...hook.searchInfo, text: '' });
          },
        });
      },
    },

    {
      // found properties grid container
      searchFn: searchByClasses(['property-grid']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, { ...child.props }, [
          ...(hook?.results?.length > 0
            ? hook.results.map((result: MLSPropertyExtended, i) => {
                const ids = [...hook.ids];

                const isPicked = ids.includes(result.ListingID);
                const onClick = () => {
                  if (isPicked) {
                    ids.splice(hook.ids.indexOf(result.ListingID), 1);
                  } else {
                    ids.push(result.ListingID);
                  }
                  hook.setIds(ids);
                  // forceUpdate();
                };
                return (
                  <AddhomeCard
                    picked={isPicked}
                    onClick={onClick}
                    property={result}
                    child={templates.card}
                    key={i}
                    replacements={{
                      PArea: result.Area || 'N/A',
                      'PropertyCard Price': `$${result.AskingPrice || 'N/A'}`,
                      'PropertyCard Address': mapStrAddress(result) || '',
                      PBd: result.L_BedroomTotal || 'N/A',
                      PBth: result.L_TotalBaths || 'N/A',
                      Psq: result.L_FloorArea_GrantTotal || 'N/A',
                      PYear: result.L_YearBuilt || 'N/A',
                    }}
                  />
                );
              })
            : []),
        ]);
      },
    },
    {
      searchFn: searchByClasses(['button-primary']),
      transformChild: (child: React.ReactElement) =>
        cloneElement(child, {
          ...child.props,
          onClick: () => {
            setProperties(prev => {
              const prevIds = [...prev.map(p => p.ListingID)];
              const newPropertiesList = [...prev, ...hook.results.filter(r => !prevIds.includes(r.ListingID))].filter((item: MLSPropertyExtended) =>
                hook.ids.includes(item.ListingID),
              );

              return [...Array.from(newPropertiesList)];
            });
            setShow(false);
          },
        }),
    },
  ];

  return <>{transformMatchingElements(child, matches)}</>;
}
