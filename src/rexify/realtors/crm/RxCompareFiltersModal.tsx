/* eslint-disable react-hooks/exhaustive-deps */
import React, { cloneElement } from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { sortArrayAlphabetically } from '@/_utilities/array-helper';
import styles from './RxCompareFiltersModal.module.scss';
import { CheckIcon } from '@heroicons/react/24/solid';
import { classNames } from '@/_utilities/html-helper';
type Props = {
  children: React.ReactElement;
  className?: string;
  id?: string;
  filters?: string[];
};

function Iterator(
  p: Props & {
    category?: { name: string; options: { value: number; label: string }[] };
    'child-category'?: { value: number; label: string };
    'selected-filters'?: { [key: string]: string[] };
    onClick: (evt: React.MouseEvent<HTMLButtonElement>) => void;
    onClose: (evt: React.MouseEvent<HTMLButtonElement>) => void;
    toggleFilter: (category: string, filter?: string) => void;
    onInputFilter: (evt: React.KeyboardEvent<HTMLInputElement>) => void;
    keyword?: string;
  },
) {
  const Wrapped = React.Children.map(p.children, (child, idx) => {
    if (child.props.placeholder === 'Search') {
      return React.cloneElement(child, {
        ...child.props,
        onChange: p.onInputFilter,
      });
    } else if (child.type === 'div' || child.type === 'form') {
      if (typeof child.props.children !== 'string') {
        if (child.props.className.indexOf('checkbox-wrap') >= 0) {
          if (idx > 0) return null;
          else {
            if (p.keyword?.length && p['child-category']?.label && p['child-category'].label.toLowerCase().indexOf(p.keyword.toLowerCase()) === -1) {
              return <></>;
            }
            return (
              <>
                {p.category &&
                  p.category.options
                    .filter(({ label }) => {
                      if (p.keyword?.length && label.toLowerCase().indexOf(p.keyword.toLowerCase()) === -1) {
                        return false;
                      }
                      return true;
                    })
                    .map(c => {
                      return React.cloneElement(child, {
                        ...child.props,
                        key: `${c.label}-${c.value}`,
                        children: (
                          <Iterator {...p} child-category={c}>
                            {child.props.children}
                          </Iterator>
                        ),
                      });
                    })}
              </>
            );
          }
        }
        if (child.props.className.indexOf('checkbox-flex') >= 0) {
          return React.cloneElement(child, {
            ...child.props,
            className: child.props.className + ' rexified',
            children: <Iterator {...p}>{child.props.children}</Iterator>,
          });
        }
        return (
          <div {...child.props}>
            <Iterator {...p}>{child.props.children}</Iterator>
          </div>
        );
      }
    } else if (child.props['data-group'] === 'category_field' && p.category) {
      // filter checkbox
      return (
        <>
          {p.category &&
            p.category.name &&
            p.category.options
              .filter(({ label }) => {
                if (p.keyword?.length && label.toLowerCase().indexOf(p.keyword.toLowerCase()) === -1) {
                  return false;
                }
                return true;
              })
              .map(c => {
                return React.cloneElement(
                  child,
                  {
                    key: `${c.label}-${c.value}`,
                    onClick: (evt: React.MouseEvent<HTMLLabelElement>) => {
                      evt.preventDefault();
                      evt.stopPropagation();
                      p.category && p.toggleFilter(p.category.name, c.label);
                    },
                  },
                  child.props.children
                    ? React.Children.map(child.props.children, cc => {
                        if (cc.type === 'div') {
                          return (
                            <span
                              className={[
                                cc.props.className,
                                c.label &&
                                p.category &&
                                p['selected-filters'] &&
                                p['selected-filters'][p.category.name] &&
                                p['selected-filters'][p.category.name].indexOf(c.label) >= 0
                                  ? 'w--redirected-checked'
                                  : '',
                              ].join(' ')}
                            />
                          );
                        } else if (cc.type === 'input') return <></>;
                        return cloneElement(cc, {}, c.label);
                      })
                    : undefined,
                );
              })}
        </>
      );
    } else if (child.type === 'a') {
      if (child.props.className?.indexOf('filter-update-button') >= 0) {
        return React.cloneElement(<button type='button' />, {
          ...child.props,
          href: undefined,
          onClick: p.onClose,
          children: React.Children.map(child.props.children, btn => {
            if (btn.type === 'div') {
              return React.cloneElement(<span />, {
                ...btn.props,
              });
            }
            return btn;
          }),
        });
      }
      if (child.props.children.props.children === 'Category')
        return p.filters
          ? p.filters.map(cat =>
              React.cloneElement(<button type='button' data-key={cat} />, {
                ...child.props,
                className:
                  child.props.className
                    .split(' ')
                    .filter((c: string) => c !== 'w--current')
                    .join(' ') +
                  ' capitalize' +
                  (p.category && p.category?.name === cat ? ' w--current' : ''),
                key: `btn-${cat}`,
                children: cat.split('_').join(' '),
                onClick: p.onClick,
              }),
            )
          : [];
    } else if (child.type === 'label') {
      return React.cloneElement(
        child,
        {
          onClick: (evt: React.MouseEvent<HTMLLabelElement>) => {
            evt.preventDefault();
            evt.stopPropagation();
            p.category && p.toggleFilter(p.category.name, p['child-category']?.label);
          },
        },
        React.Children.map(child.props.children, checkbox => {
          if (checkbox.type === 'div') {
            return (
              <span
                className={[
                  checkbox.props.className,
                  p['child-category'] &&
                  p.category &&
                  p['selected-filters'] &&
                  p['selected-filters'][p.category.name] &&
                  p['selected-filters'][p.category.name].indexOf(p['child-category'].label) >= 0
                    ? 'w--redirected-checked'
                    : '',
                ].join(' ')}
              >
                {checkbox.props.children}
              </span>
            );
          } else if (checkbox.type === 'span') {
            return React.cloneElement(checkbox, {
              ...checkbox.props,
              children: p['child-category'] ? p['child-category'].label : '',
            });
          }
          return checkbox;
        }),
      );
    }
    return child;
  });
  return <>{Wrapped}</>;
}
export const relationship_based_attributes: { [key: string]: string } = {
  Appliances: 'appliances',
  Amenities: 'amenities',
  'Construction Material': 'build_features',
  'Connected Services': 'connected_services',
  Facilities: 'facilities',
  Flooring: 'build_features',
  'Heating & Ventilation / Air Conditioning': 'hvac',
  Parking: 'parking',
  Windows: 'build_features',
};
export const field_aliases: { [key: string]: string } = {
  'Age Restrictions': 'min_age_restriction',
  'Date Listed': 'listed_at',
  'Pet Policy': 'pets',
  'Lot Area': 'lot_sqft',
  'Price/Sqft.': 'price_per_sqft',
  'Total # of fireplaces': 'total_fireplaces',
  'Total Units in Community': 'total_units_in_community',
};
const amenities_facilities = ['Amenities', 'Appliances', 'Facilities', 'Parking', 'Total Parking'];

export const home_attributes = sortArrayAlphabetically(
  ['Age', 'Foundation Specs', 'Frontage', 'Floor Levels', 'Gross Taxes', 'Strata Fee', 'Year Built']
    .concat(
      Object.keys(relationship_based_attributes)
        .filter(k => !amenities_facilities.includes(k))
        .map(key => key),
    )
    .concat(
      Object.keys(field_aliases)
        .filter(key => !['Pet Policy', 'Total Units in Community'].includes(key))
        .map(key => key),
    ),
);

const restrictions = ['Pet Policy', 'Age Restrictions'];

const services = ['Connected Services', 'Maintenance Services', 'Security'];

const transit_neighbourhood = ['Places of Interest', 'Total Units in Community'];

export default function RxCompareFiltersModal(
  p: Props & {
    selected_filters?: { [key: string]: string[] };
    updateFilters?: (filters: { [key: string]: unknown }) => void;
    exclude?: string[];
  },
) {
  console.log(p);
  const filterEvent = useEvent(Events.AddPropertyFilter);
  const [filter_keyword, setKeyword] = React.useState('');
  const [selected_filters, setFilters] = React.useState<{ [key: string]: string[] }>(
    p.selected_filters || {
      'Home Attributes': ['Age', 'Date Listed', 'Gross Taxes', 'Floor Area', 'Lot Area', 'Price/Sqft.', 'Strata Fee', 'Total Parking', 'Year Built'],
    },
  );
  const [attributes, setAttributes] = React.useState<{ [key: string]: { label: string; value: number }[] }>();
  const [category, selectCategory] = React.useState<{ options: { value: number; label: string }[]; name: string }>();
  const handleClick = (action: string) => {
    const categories = attributes as unknown as {
      [key: string]: {
        value: number;
        label: string;
      }[];
    };
    selectCategory({
      options: categories[action],
      name: action,
    });
  };

  React.useEffect(() => {
    let filters: string[] = [];
    Object.keys(selected_filters).forEach(k => {
      filters = [...filters, ...selected_filters[k]];
    });
    filterEvent.fireEvent({
      filters,
    } as unknown as EventsData);
  }, [selected_filters]);

  React.useEffect(() => {
    setAttributes({
      'Home Attributes': home_attributes
        .filter(attr => !p.exclude || !p.exclude.includes(attr))
        .map((attr, idx) => ({
          value: idx + 1,
          label: attr,
        })),
      'Facilities & Amenities': amenities_facilities
        .filter(attr => !p.exclude || !p.exclude.includes(attr))
        .map((attr, idx) => ({
          value: idx + 1,
          label: attr,
        })),
      Restrictions: restrictions
        .filter(attr => !p.exclude || !p.exclude.includes(attr))
        .map((attr, idx) => ({
          value: idx + 1,
          label: attr,
        })),
      Services: services
        .filter(attr => !p.exclude || !p.exclude.includes(attr))
        .map((attr, idx) => ({
          value: idx + 1,
          label: attr,
        })),
      Neighbourhood: transit_neighbourhood
        .filter(attr => !p.exclude || !p.exclude.includes(attr))
        .map((attr, idx) => ({
          value: idx + 1,
          label: attr,
        })),
    });
    if (p.selected_filters) setFilters(p.selected_filters);
  }, []);

  const onInputFilter = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    setKeyword(evt.currentTarget.value);
  };

  return (
    <div id={p?.id || 'compare-filters-modal'} className={[p.className || ''].join(' ')}>
      <Iterator
        filters={(attributes && Object.keys(attributes as unknown as { [key: string]: unknown })) || []}
        onInputFilter={onInputFilter}
        onClick={(evt: React.MouseEvent<HTMLButtonElement>) => {
          handleClick(evt.currentTarget.dataset.key || '');
        }}
        onClose={(evt: React.MouseEvent<HTMLButtonElement>) => {
          evt.preventDefault();
          document.getElementById('customer-view-modal-compare-filters')?.classList.remove('is-really-visible');
          document.getElementById('modal-compare-filters')?.classList.remove('is-really-visible');
          document.getElementById('modal-compare-filters')?.classList.remove(styles['show-modal']);
          document.getElementById('modal-compare-filters')?.classList.add('hidden-block');
          p.updateFilters && p.updateFilters(selected_filters);
        }}
        category={category}
        selected-filters={selected_filters}
        keyword={filter_keyword}
        toggleFilter={(c: string, label?: string) => {
          if (label) {
            if (!selected_filters[c]) {
              setFilters({
                ...selected_filters,
                [c]: [label],
              });
            } else {
              const existing_idx = selected_filters[c].indexOf(label);
              if (existing_idx === -1)
                setFilters({
                  ...selected_filters,
                  [c]: [...selected_filters[c], label],
                });
              else {
                selected_filters[c].splice(existing_idx, 1);
                setFilters({
                  ...selected_filters,
                });
              }
            }
          }
        }}
      >
        {p.children}
      </Iterator>
    </div>
  );
}
