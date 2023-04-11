import React, { useState, useEffect, cloneElement, Dispatch, ReactElement, SetStateAction, createElement } from 'react';
import { BTNS, FILTERS } from '@/_helpers/constants';
import { captureMatchingElements, removeKeys, replaceTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { classNames } from '@/_utilities/html-helper';
import { searchByClasses, searchById } from '@/_utilities/rx-element-extractor';
import FiltersItem from './FiltersItem';
import { Filter } from '@/_typings/filters_compare';
import { removeClasses } from '@/_helpers/functions';

type Props = { child: ReactElement; filters: Filter[]; setFilters: Dispatch<SetStateAction<Filter[]>> };

export default function FiltersModalWrapper({ child, filters, setFilters }: Props) {
  const [show, setShow] = useState(false);
  const [category, setCategory] = useState<string>('general');
  const [checkedList, setCheckedList] = useState<string[]>([...filters.map(f => f.title)]);
  const [templates, setTemplates] = useState<Record<string, React.ReactElement>>({});
  const [searchStr, setSearchStr] = useState<string>('');
  const templatesToFind = [
    {
      elementName: 'tabTemplate',
      searchFn: searchByClasses(['tab-button-vertical-toggle', 'w-tab-link']),
    },
    {
      elementName: 'checkboxTemplate',
      searchFn: searchByClasses(['checkbox-wrap']),
    },
    { elementName: 'tabPane', searchFn: searchByClasses(['tab-pane']) },
  ];
  useEffect(() => {
    document.addEventListener(
      'filters-click',
      () => {
        setShow(true);
      },
      false,
    );

    setTemplates(captureMatchingElements(child, templatesToFind));
    return () => {
      document.removeEventListener('filters', () => {});
    };
  }, []);

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
            setFilters([...FILTERS.filter(f => checkedList.includes(f.title))]);
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
        if (templates?.checkboxTemplate) {
          const cleanedClasses = removeClasses(templates.tabTemplate.props.className, ['w--current']);
          tabs = [
            ...BTNS.map(btn =>
              replaceTextWithBraces(
                React.createElement('div', {
                  ...removeKeys(templates.tabTemplate.props, ['data-w-tab', 'tabindex']),
                  className: classNames(cleanedClasses, `${category === btn.type ? 'w--current' : ''}`),
                  key: `${btn.title}_${btn.type}`,
                  value: btn.type,
                  onClick: (e: React.SyntheticEvent) => {
                    setCategory(btn.type);
                  },
                }),
                btn.title,
              ),
            ),
          ];
        }
        return cloneElement(child, {}, [...tabs]);
      },
    },

    {
      // changing  right side  of the filters modal
      searchFn: searchByClasses(['tabs-content', 'w-tab-content']),
      transformChild: (child: ReactElement) => {
        const currentFilters = FILTERS.filter(f => f.types.includes(category));
        // filling tab with filtered Filters that matches selected category
        const matchesTab = [
          {
            searchFn: searchByClasses(['checkboxes-grid']),
            transformChild: (child: ReactElement) => {
              return createElement('div', { className: child.props.className }, [
                ...currentFilters
                  .filter(f => f.title.toLowerCase().includes(searchStr))
                  .map((f, i) => {
                    const isPicked = checkedList.includes(f.title);
                    const handleCheckClick = () => {
                      setCheckedList(isPicked ? [...checkedList.filter(item => item !== f.title)] : [...checkedList, f.title]);
                    };
                    return (
                      <FiltersItem
                        handleCheckList={handleCheckClick}
                        isPicked={checkedList.includes(f.title)}
                        key={`${f.title}_${f.keys[0]}`}
                        item={f}
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
            setFilters([...FILTERS.filter(f => checkedList.includes(f.title))]);
            setShow(false);
          },
        });
      },
    },
  ];

  return <>{transformMatchingElements(child, insideMatch)}</>;
}
