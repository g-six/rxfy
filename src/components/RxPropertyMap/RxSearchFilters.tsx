import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { useMapMultiUpdater, useMapState } from '@/app/AppContext.module';
import React from 'react';
import RxLiveNumericStep from '../RxLiveUrlBased/RxLiveNumericStep';
import RxLiveNumber from '../RxLiveUrlBased/RxLiveNumber';
import RxCombobox from '../RxCombobox';
import RxLiveStringValue from '../RxLiveUrlBased/RxLiveStringValue';
import RxDatePicker from '../RxForms/RxInputs/RxDatePicker';
import RxLiveInput from '../RxLiveUrlBased/RxLiveInput';
import RxLiveCheckbox from '../RxLiveUrlBased/RxLiveBaseCheckbox';
import RxLiveTextDDOption from '@/components/RxLiveUrlBased/RxLiveTextDropdownOption';
import { getPropertyTypeFromSelector, getSortingKey } from '@/_utilities/rx-map-helper';
import RxMapTermsFilter from '../RxMapTermsFilter';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import RxLiveToggle from '../RxLiveUrlBased/RxLiveToggle';
type Props = {
  children: React.ReactElement[];
  className?: string;
  'data-agent-id'?: string;
};
export default function RxSearchFilters(p: Props) {
  const rx_map_state = useMapState();
  const rx_map = useMapMultiUpdater();

  const [show, toggleOpen] = React.useState<{
    [key: string]: boolean;
  }>({});
  const { children } = p;

  const handleClick = (e: React.MouseEvent) => {
    e.currentTarget.classList.forEach((v, i) => {
      switch (v) {
        case 'bedbathandbeyond-toggle':
          toggleOpen({
            bedbathandbeyond: !show.bedbathandbeyond,
          });
          break;
        case 'priceminmax-toggle':
          toggleOpen({
            price: !show.price,
          });
          break;
        case 'proptypefilters-toggle':
          toggleOpen({
            proptypefilters: !show.proptypefilters,
          });
          break;
        case 'min-price-toggle':
          toggleOpen({
            ...show,
            maxprice: false,
            minprice: show.maxprice || !show.minprice,
          });
          break;
        case 'max-price-toggle':
          toggleOpen({
            ...show,
            minprice: false,
            maxprice: show.minprice || !show.minprice,
          });
          break;
        case 'map-sort-modal-button':
          toggleOpen({
            sorter: !show.sorter,
          });
          break;
        case 'do-search':
          rx_map(rx_map_state, { reload: true });
        case 'do-reset':
        case 'close-link-right':
          e.preventDefault();
          toggleOpen({});
          break;
      }
    });
  };

  const matches = [
    {
      searchFn: searchByClasses(['toggle-base']),
      transformChild: (child: React.ReactElement) => {
        const { 'data-agent-id': agent_id } = p as unknown as {
          [key: string]: string;
        };
        return <RxLiveToggle filter='agent' value={agent_id} />;
      },
    },
    {
      searchFn: searchByPartOfClass(['ptype-']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveCheckbox child={child} filter='types' value={getPropertyTypeFromSelector(child.props.className)} />;
      },
    },
    {
      searchFn: searchByPartOfClass(['-desc']),
      transformChild: (child: React.ReactElement) => {
        const sorting = getSortingKey(child.props.className);
        return <RxLiveTextDDOption child={child} filter='sorting' value={sorting} />;
      },
    },
    {
      searchFn: searchByPartOfClass(['-asc']),
      transformChild: (child: React.ReactElement) => {
        const sorting = getSortingKey(child.props.className);
        return <RxLiveTextDDOption child={child} filter='sorting' value={sorting} />;
      },
    },
    {
      searchFn: searchByPartOfClass(['input-keywords']),
      transformChild: (child: React.ReactElement) => {
        return <RxMapTermsFilter className={child.props.className || ''} filter='tags' />;
      },
    },
    {
      searchFn: searchByClasses(['beds-less']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveNumericStep child={child} filter='beds' />;
      },
    },
    {
      searchFn: searchByClasses(['beds-more']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveNumericStep child={child} filter='beds' />;
      },
    },
    {
      searchFn: searchByClasses(['beds-min']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveNumber className={child.props.className} filter='beds' />;
      },
    },
    {
      searchFn: searchByClasses(['sqft-min']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveInput className={child.props.className} filter='minsqft' inputType='number' />;
      },
    },
    {
      searchFn: searchByClasses(['sqft-max']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveInput className={child.props.className} filter='maxsqft' inputType='number' />;
      },
    },
    {
      searchFn: searchByClasses(['date-listed-since']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxDatePicker
            {...child.props}
            onChange={(ts: number) => {
              if (ts) {
                rx_map(rx_map_state, {
                  dt_to: new Date(ts),
                });
              }
            }}
            maxvalue={new Date()}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['date-newer-than']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxDatePicker
            {...child.props}
            onChange={(ts: number) => {
              if (ts) {
                rx_map(rx_map_state, {
                  dt_from: new Date(ts),
                });
              }
            }}
            filter='dt_from'
            maxvalue={new Date()}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['baths-less']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveNumericStep child={child} filter='baths' />;
      },
    },
    {
      searchFn: searchByClasses(['baths-more']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveNumericStep child={child} filter='baths' />;
      },
    },
    {
      searchFn: searchByClasses(['baths-min']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveNumber className={child.props.className} filter='baths' />;
      },
    },
    {
      searchFn: searchByClasses(['combobox-toggle', 'min-price-toggle']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${show.minprice ? 'w--open' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['selected-price-min']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          children: rx_map_state.minprice ? getShortPrice(rx_map_state.minprice, '$') : child.props.children,
        });
      },
    },
    {
      searchFn: searchByClasses(['selected-price-max']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          children: rx_map_state.maxprice ? getShortPrice(rx_map_state.maxprice, '$') : child.props.children,
        });
      },
    },
    {
      searchFn: searchByClasses(['do-search']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['do-reset']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['close-link-right']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['combobox-toggle', 'max-price-toggle']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${show.maxprice ? 'w--open' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['combobox-list', 'min-price-dropdown']),
      transformChild: (child: React.ReactElement) => {
        const wrapper = child.props.children as React.ReactElement;
        return React.cloneElement(
          <RxCombobox element-type='div' className={`${child.props.className} scrollable`} data-value-for='minprice'>
            {wrapper.props.children}
          </RxCombobox>,
          {
            ...child.props,
            children: wrapper.props.children,
            className: `${show.minprice ? 'w--open' : ''} ${child.props.className}`.trim(),
            onClick: (key: string) => {
              toggleOpen({
                ...show,
                [key]: false,
              });
            },
          },
        );
      },
    },
    {
      searchFn: searchByClasses(['combobox-list', 'max-price-dropdown']),
      transformChild: (child: React.ReactElement) => {
        const wrapper = child.props.children as React.ReactElement;
        return React.cloneElement(
          <RxCombobox element-type='div' className={`${child.props.className} scrollable`} data-value-for='maxprice'>
            {wrapper.props.children}
          </RxCombobox>,
          {
            ...child.props,
            children: wrapper.props.children,
            className: `${show.maxprice ? 'w--open' : ''} ${child.props.className}`.trim(),
            onClick: (key: string) => {
              toggleOpen({
                ...show,
                [key]: false,
              });
            },
          },
        );
      },
    },
    {
      searchFn: searchByClasses(['propcard-stat', 'map', 'minprice']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveStringValue filter='minprice' className={child.props.className} />;
      },
    },
    {
      searchFn: searchByClasses(['propcard-stat', 'map', 'maxprice']),
      transformChild: (child: React.ReactElement) => {
        return <RxLiveStringValue filter='maxprice' className={child.props.className} />;
      },
    },
    {
      searchFn: searchByClasses(['bedbathandbeyond-dropdown']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${show.bedbathandbeyond ? 'w--open' : ''} ${child.props.className}`.trim(),
        });
      },
    },
    {
      searchFn: searchByClasses(['priceminmax-dropdown']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${show.price ? 'w--open' : ''} ${child.props.className}`.trim(),
        });
      },
    },
    {
      searchFn: searchByClasses(['filters-dropdown-modal', 'proptype']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${show.proptypefilters ? 'w--open' : ''} ${child.props.className}`.trim(),
        });
      },
    },
    {
      searchFn: searchByClasses(['sorting-dropdown-list']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${show.sorter ? 'w--open' : ''} ${child.props.className}`.trim(),
        });
      },
    },
    {
      searchFn: searchByClasses(['bedbathandbeyond-toggle']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['map-sort-modal-button']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${show.sorter ? 'w--open' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['priceminmax-toggle']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${show.priceminmax ? 'w--open' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['proptypefilters-toggle']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${show.proptypefilters ? 'w--open' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
  ];

  if (!p['data-agent-id']) {
    // Not viewing map through agent
    if (p.className?.includes('listings-by-agent')) {
      return <></>;
    }
  }

  return (
    <fieldset {...p} className={`${p.className || ''} rexified`.trim()}>
      {transformMatchingElements(children, matches)}
    </fieldset>
  );
}
