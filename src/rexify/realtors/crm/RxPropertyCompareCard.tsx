import React from 'react';
import { LovedPropertyDataModel } from '@/_typings/property';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { field_aliases, relationship_based_attributes } from './RxCompareFiltersModal';
import { useDrag, useDrop, ConnectDropTarget } from 'react-dnd';
import { Card } from './CustomerCompareCanvas';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { LISTING_FEETERS_FIELDS, LISTING_MONEY_FIELDS, LISTING_NUMERIC_FIELDS } from '@/_utilities/data-helpers/listings-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';

type Props = { children: React.ReactElement | React.ReactElement[]; className: string; removeCard: () => void };

function StatsIterator(p: { className?: string; children: React.ReactElement; label: string; value: string }) {
  const Wrapper = React.Children.map(p.children, child => {
    if (typeof child?.props?.children === 'string') {
      switch (child.props.children) {
        case '{Compare Stat Name}':
        case 'Compare Stat Name':
          return React.cloneElement(child, {
            ...child.props,
            children: capitalizeFirstLetter(p.label.split('_').join(' ')),
          });
        case '{Compare Stat}':
        case 'Compare Stat':
          return React.cloneElement(child, {
            ...child.props,
            children: p.value,
          });
      }
    } else if (child.props.children) return React.cloneElement(child, {}, <StatsIterator {...p}>{child.props.children}</StatsIterator>);
    return child;
  });
  return <>{Wrapper}</>;
}

export default function RxPropertyCompareCard(
  p: Props & {
    property: Card;
    'include-stats'?: string[];
    moveProperty?: (item_id: number, replace_id: number) => void;
  },
) {
  const { fireEvent } = useEvent(Events.SelectCustomerLovedProperty);
  const { data: selections, fireEvent: updateSelection } = useEvent(Events.AddPropertyToCompare);
  const ref = React.useRef<HTMLDivElement>(null);
  const [drag_props, drag] = useDrag(
    {
      type: 'property',
      item: p.property,
      collect: monitor => {
        return {
          isDragging: monitor.isDragging(),
          started: monitor.getSourceClientOffset()?.x,
        };
      },
    },
    [],
  );

  const [, drop] = useDrop({
    accept: 'property',
    drop: (item: any, monitor) => {
      if (ref.current && document.querySelector(`[data-position="${ref.current.dataset.position}"]`)) {
        document.querySelectorAll('[data-position]')?.forEach(el => el.removeAttribute('style'));
        const swap_value = document.querySelector(`[data-position="${ref.current.dataset.position}"]`)?.getAttribute('property-id');
        if (swap_value) p.moveProperty && p.moveProperty(Number(swap_value), item.id);
      }
    },
    hover() {
      if (ref.current) {
        let property_id = document.querySelector(`[data-position="${ref.current.dataset.position}"]`)?.getAttribute('property-id');
        if (property_id) {
          document.querySelectorAll('[data-position]')?.forEach(el => el.removeAttribute('style'));
          document.querySelector(`[data-position="${ref.current.dataset.position}"]`)?.setAttribute('style', 'padding-right: 300px; ');
        }
      }
    },
    collect: monitor => ({
      ended: monitor.getClientOffset()?.x,
    }),
  });

  const Wrapper = React.Children.map(p.children, (child, child_idx) => {
    if (child.props?.className) {
      if (typeof child.props.children === 'string') {
        let text_content = child.props.children;
        switch (child.props.children) {
          case '{Comp Price}':
            text_content = p.property.asking_price ? '$' + new Intl.NumberFormat().format(p.property.asking_price) : '';
            break;
          case '{Comp Address}':
            text_content = p.property.title;
            break;
          case '{PBd}':
            text_content = p.property.beds;
            break;
          case '{PBth}':
            text_content = p.property.baths;
            break;
          case '{Psq}':
            text_content = new Intl.NumberFormat().format(p.property.floor_area_total || 0) || '';
            break;
        }
        return React.cloneElement(child, {
          ...child.props,
          id: `${text_content} ${p.property.id}`,
          key: `${text_content} ${p.property.id}`,
          children: text_content,
        });
      } else if (child.props.className === 'img-placeholder') {
        return null;
      } else if (child.props.className === 'compare-stats-wrapper') {
        console.log('function RxPropertyCompareCard include-stats', p['include-stats']);
        return p['include-stats'] ? (
          React.cloneElement(child, {
            ...child.props,
            'include-stats': p['include-stats'].join(','),
            id: `${child.props.className}-${p.property.id}`,
            key: `${child.props.className}-${p.property.id}`,
            children: p['include-stats'].map((stat_name: string) => {
              if (child.props.children)
                return React.cloneElement(child.props.children[0], {
                  ...child.props.children[0].props,
                  key: stat_name || 'no-valid-stat-name',
                  children: (
                    <StatsIterator
                      key={stat_name || 'no-valid-stat-name'}
                      label={stat_name}
                      value={getStatsValue(
                        stat_name,
                        p.property as unknown as {
                          [key: string]: string;
                        },
                      )}
                    >
                      {child.props.children[0].props.children}
                    </StatsIterator>
                  ),
                });
            }),
          })
        ) : (
          <></>
        );
      } else if (child.props.className === 'propcompare-card-image') {
        return React.cloneElement(child, {
          ...child.props,
          className: child.props.className + ' bg-center bg-cover',
          children: (
            <CompareCardItems
              {...p}
              key={`compare-item-image-${child_idx}`}
              onExpandInfoLinkClick={() => {
                fireEvent(p.property as unknown as EventsData);
              }}
              removeCard={() => {
                console.log(p.property.id);
              }}
            >
              {child.props.children}
            </CompareCardItems>
          ),
        });
      } else if (child.type === 'div') {
        return (
          <div className={child.props.className || ''} key={`compare-car-item-${child_idx}`}>
            <CompareCardItems
              {...p}
              key={`compare-item-wrapper-${child_idx}`}
              onExpandInfoLinkClick={() => {
                fireEvent(p.property as unknown as EventsData);
                const btn = document.querySelector('button#w-tabs-0-data-w-tab-0') as HTMLButtonElement;
                btn.click();
              }}
              removeCard={() => {
                p.removeCard();
                if (selections) {
                  // const { properties: prev } = selections as unknown as { properties: Card[] };
                  // prev.splice(prev.indexOf(p.property), 1);
                  // updateSelection({
                  //   properties: [...prev],
                  // } as unknown as EventsData);
                }
              }}
            >
              {child.props.children}
            </CompareCardItems>
          </div>
        );
      }
    }

    return child;
  });

  React.useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute('data-position', `${ref.current.getBoundingClientRect().x}`);
    }
  }, [ref]);

  drag(drop(ref));

  return (
    <div
      ref={ref}
      property-id={p.property.id}
      className={['bg-transparent transition-transform', drag_props.isDragging ? 'opacity-0 overflow-hidden hidden' : 'opacity-100'].join(' ')}
    >
      {Wrapper}
    </div>
  );
}

function getStatsValue(key: string, kv: { [key: string]: unknown }): string {
  let db_column = key.split(' ').join('_').toLowerCase();
  let val = `${kv[db_column] || ''}`;

  if (Object.keys(field_aliases).includes(key)) {
    db_column = field_aliases[key];
    val = kv[field_aliases[key]] as string;
  } else if (Object.keys(relationship_based_attributes).includes(key)) {
    db_column = relationship_based_attributes[key];
    const { [db_column]: relationship } = kv as {
      [key: string]: {
        data: {
          attributes: {
            name: string;
          };
        }[];
      };
    };
    if (relationship?.data) {
      const { data } = relationship;
      let exclude_values_with_words: string[] = [];
      if (db_column === 'build_features') {
        switch (key) {
          case 'Construction Material':
            exclude_values_with_words = ['Flooring', 'Window'];
            break;
          case 'Flooring':
            exclude_values_with_words = ['Construction Material', 'Windows'];
            break;
          case 'Windows':
            exclude_values_with_words = ['Construction Material', 'Flooring'];
            break;
        }
      }
      val =
        data && data.length
          ? data
              .map(({ attributes: { name } }) => name)
              .filter(v => exclude_values_with_words.filter(words => v.indexOf(words) >= 0).length === 0)
              //   .map(removeGenericWords)
              .join(' • ')
          : 'N/A';
    }
  } else if (typeof kv[key] === 'object') {
    console.log('CustomerCompareCanvas attribute not handled:', key, kv[key]);
    return '';
  }

  // if (LISTING_MONEY_FIELDS.includes(db_column) && val) {
  //   val = val ? formatValues(kv, db_column) : 'N/A';
  // } else if (LISTING_NUMERIC_FIELDS.includes(db_column)) {
  //   val = val && !isNaN(Number(val)) ? new Intl.NumberFormat().format(Number(val)) : 'N/A';
  // } else if (LISTING_FEETERS_FIELDS.includes(db_column)) {
  //   val = val ? new Intl.NumberFormat().format(Number(val)) + ' Sqft' : 'N/A';
  // }
  return val ? formatValues(kv, db_column) : 'N/A';
}

function CompareCardItems(
  p: Props & { property: LovedPropertyDataModel; 'include-stats'?: string[]; onExpandInfoLinkClick: () => void; removeCard: () => void },
) {
  const Wrapper = React.Children.map(p.children, (child, child_idx) => {
    if (child.props?.className) {
      if (typeof child.props.children === 'string') {
        let text_content = child.props.children;
        switch (child.props.children) {
          case '{Comp Price}':
            text_content = p.property.asking_price ? '$' + new Intl.NumberFormat().format(p.property.asking_price) : '';
            break;
          case '{Comp Address}':
            text_content = p.property.title;
            break;
          case '{PBd}':
            text_content = p.property.beds;
            break;
          case '{PBth}':
            text_content = p.property.baths;
            break;
          case '{Psq}':
            text_content = new Intl.NumberFormat().format(p.property.floor_area_total || p.property.floor_area_main || p.property.floor_area || 0) || '';
            break;
        }
        return React.cloneElement(child, {
          ...child.props,
          key: `${text_content} ${p.property.id}`,
          children: text_content,
        });
      } else if (child.props.className === 'img-placeholder') {
        return null;
      } else if (child.props['data-group'] === 'compare_stat') {
        return p['include-stats'] ? (
          p['include-stats'].map((stat_name: string) => {
            return (
              <StatsIterator
                key={stat_name || 'no-valid-stat-name'}
                label={stat_name}
                value={getStatsValue(
                  stat_name,
                  p.property as unknown as {
                    [key: string]: string;
                  },
                )}
              >
                {child}
              </StatsIterator>
            );
          })
        ) : (
          <></>
        );
      } else if (child.props.className === 'external-link') {
        return React.cloneElement(child, {
          ...child.props,
          className: child.props.className + ' cursor-pointer',
          onClick: p.onExpandInfoLinkClick,
        });
      } else if (child.props.className === 'x') {
        return React.cloneElement(child, {
          ...child.props,
          className: child.props.className + ' cursor-pointer',
          onClick: p.removeCard,
        });
      } else if (child.props.className === 'propcompare-card-image') {
        return React.cloneElement(child, {
          ...child.props,
          className: child.props.className + ' bg-center bg-cover',
          children: (
            <CompareCardItems {...p} key={`compare-item-image-${child_idx}`}>
              {child.props.children}
            </CompareCardItems>
          ),
          style: {
            backgroundImage: `url(${p.property.cover_photo})`,
          },
        });
      } else if (child.type === 'div') {
        return (
          <div className={child.props.className || ''} key={`compare-car-item-${child_idx}`}>
            <CompareCardItems {...p} key={`compare-item-wrapper-${child_idx}`}>
              {child.props.children}
            </CompareCardItems>
          </div>
        );
      }
    }

    return child;
  });
  return <>{Wrapper}</>;
}
