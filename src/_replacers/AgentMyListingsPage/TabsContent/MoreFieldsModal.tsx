import React, { useState, useEffect, cloneElement, Dispatch, ReactElement, createElement } from 'react';
import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { classNames } from '@/_utilities/html-helper';
import { searchByClasses, searchById, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { removeClasses } from '@/_helpers/functions';
import useEvent, { Events } from '@/hooks/useEvent';
import FiltersTabsItem from '@/_replacers/ComparePage/FiltersTabsItem';
import { ValueInterface } from '@/_typings/ui-types';
import Checkbox from '@/_replacers/FilterFields/CheckBox';

type Props = { child: ReactElement; filters: { [key: string]: ValueInterface[] }; setFilters: Dispatch<any> };

export default function MoreFieldsModalWrapper({ child, filters, setFilters }: Props) {
  const { data, fireEvent } = useEvent(Events.CompareFiltersModal);
  const [show, setShow] = useState(false);
  const categories = Object.keys(filters).map(item => ({ label: item.split('_').join(' ').toUpperCase(), value: item }));
  const [category, setCategory] = useState<string>(categories[0].value);
  const [checkedList, setCheckedList] = useState<{ [key: string]: (string | number)[] }>({});
  const [searchStr, setSearchStr] = useState<string>('');
  console.log(checkedList);
  const templatesToFind = [
    {
      elementName: 'tabTemplate',
      searchFn: searchByClasses(['tab-button-vertical-toggle']),
    },
    {
      elementName: 'checkboxTemplate',
      searchFn: searchByPartOfClass(['dropdown-link']),
    },
    { elementName: 'tabPane', searchFn: searchByPartOfClass(['tab-pane']) },
  ];
  const [templates, setTemplates] = useState<Record<string, React.ReactElement>>(captureMatchingElements(child, templatesToFind));

  useEffect(() => {
    if (data?.show) {
      setShow(true);
    }
  }, [data]);

  const insideMatch = [
    //adding show condition to the whole filters modal component
    {
      searchFn: searchById('modal-compare-filters'),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          style: { display: show ? 'flex' : 'none' },
        });
      },
    },
    {
      //cleanup from form tag
      searchFn: searchById('email-form-3'),
      transformChild: (child: React.ReactElement) => {
        return createElement('div', { key: child.props?.key, className: child.props.className }, [...child.props.children]);
      },
    },
    {
      // closes modal when click on modals  backdrop
      searchFn: searchByClasses(['modal-background']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            setFilters(checkedList);
            setShow(false);
          },
        });
      },
    },
    {
      //creating tabs of filters categories
      searchFn: searchByClasses(['tabs-menu-toggle-vertical', 'w-tab-menu']),
      transformChild: (child: React.ReactElement) => {
        let tabs: any = [];
        if (templates?.tabTemplate) {
          const cleanedClasses = removeClasses(templates.tabTemplate.props.className, ['w--current']);

          tabs = [
            ...categories.map(btn => {
              const props = {
                className: classNames(cleanedClasses, `${category === btn.value ? 'w--current' : ''}`),
                value: btn.value,
                label: btn.label,
                onClick: (e: React.SyntheticEvent) => {
                  setCategory(btn.value);
                  setSearchStr('');
                },
              };
              return <FiltersTabsItem key={`${btn.label}_${btn.value}`} {...props} />;
            }),
          ];
        }
        return cloneElement(child, {}, [...tabs]);
      },
    },

    {
      // changing  right side  of the filters modal
      searchFn: searchByPartOfClass(['tabs-content', 'w-tab-content']),
      transformChild: (child: ReactElement) => {
        const currentFilters = filters[category];
        // filling tab with filtered Filters that matches selected category

        const matchesTab = [
          {
            searchFn: searchByPartOfClass(['checkboxes-grid']),
            transformChild: (child: ReactElement) => {
              return createElement('div', { className: child.props.className }, [
                ...currentFilters
                  .filter(it => it.name.toLocaleLowerCase().includes(searchStr))
                  .map((f, i) => {
                    const isPicked = checkedList?.[category]?.some(item => item === f.id) ?? false;
                    const handleCheckClick = () => {
                      const currentCat = checkedList?.[category] ?? [];
                      setCheckedList(prev => ({
                        ...prev,
                        [category]: isPicked ? checkedList?.[category].filter(item => item !== f.id) : [...currentCat, f.id],
                      }));
                    };
                    return (
                      <Checkbox
                        handleCheckList={handleCheckClick}
                        isPicked={checkedList?.[category]?.some(item => item === f.id) ?? false}
                        key={`${f.name}_${f.id}_${i}`}
                        item={{ title: f.name }}
                        template={templates.checkboxTemplate}
                      />
                    );
                  }),
              ]);
            },
          },
        ];
        const tabPane = templates?.tabTemplate && cloneElement(templates.tabPane, { className: `${templates.tabPane.props.className} w--tab-active` });

        return cloneElement(child, { ...child.props }, [transformMatchingElements(tabPane, matchesTab)]);
      },
    },
    {
      // search input fiters current filters list
      searchFn: searchByClasses(['compare-search-input']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          value: searchStr,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchStr(e.currentTarget.value.toLocaleLowerCase());
          },
        });
      },
    },
    {
      // clean search string on reset icon click
      searchFn: searchByClasses(['compare-search-reset']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            setSearchStr('');
          },
        });
      },
    },
    {
      // 'update filter' button gets onClick functionality
      searchFn: searchByClasses(['div-button-confirm']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            setFilters(checkedList);
            setShow(false);
          },
        });
      },
    },
  ];

  return <>{transformMatchingElements(child, insideMatch)}</>;
}
