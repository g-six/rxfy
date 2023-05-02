import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { useMapMultiUpdater, useMapState } from '@/app/AppContext.module';
import React from 'react';
import RxLiveNumericStep from '../RxLiveUrlBased/RxLiveNumericStep';
import RxLiveNumber from '../RxLiveUrlBased/RxLiveNumber';
type Props = {
  children: React.ReactElement[];
  className?: string;
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
        case 'map-sort-modal-button':
          toggleOpen({
            sorter: !show.sorter,
          });
          break;
      }
    });
  };

  const matches = [
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

  return (
    <fieldset {...p} className={`${p.className || ''} rexified`.trim()}>
      {transformMatchingElements(children, matches)}
    </fieldset>
  );
}
