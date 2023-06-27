import React from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { sortArrayAlphabetically } from '@/_utilities/array-helper';
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
  },
) {
  const Wrapped = React.Children.map(p.children, (child, idx) => {
    if (child.type === 'div' || child.type === 'form') {
      if (typeof child.props.children !== 'string') {
        if (child.props.className.indexOf('checkbox-wrap') >= 0) {
          if (idx > 0) return null;
          else {
            return (
              <>
                {p.category &&
                  p.category.options.map(c => {
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
    } else if (child.type === 'a') {
      if (child.props.className?.indexOf('filter-update-button') >= 0) {
        return React.cloneElement(<button type='button' />, {
          ...child.props,
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
      if (child.props.children.props.children === '{Category}')
        return p.filters
          ? p.filters.map(cat =>
              React.cloneElement(<button type='button' data-key={cat} />, {
                ...child.props,
                className: child.props.className + ' capitalize',
                key: `btn-${cat}`,
                children: cat.split('_').join(' '),
                onClick: p.onClick,
              }),
            )
          : [];
    } else if (child.type === 'label') {
      return React.cloneElement(child, {
        ...child.props,
        children: React.Children.map(child.props.children, checkbox => {
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
          } else if (checkbox.type) {
            return React.cloneElement(checkbox, {
              ...checkbox.props,
              name: `${p.category?.name}[]`,
              value: p['child-category'] ? p['child-category'].value : '',
            });
          }
          return checkbox;
        }),
        onClick: (evt: React.MouseEvent<HTMLLabelElement>) => {
          evt.preventDefault();
          evt.stopPropagation();
          p.category && p.toggleFilter(p.category.name, p['child-category']?.label);
        },
      });
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
  'Date Listed': 'listed_at',
  'Lot Area': 'lot_sqft',
  'Price/Sqft.': 'price_per_sqft',
};
const amenities_facilities = ['Amenities', 'Appliances', 'Facilities', 'Parking'];
export const home_attributes = sortArrayAlphabetically(
  ['Age', 'Foundation Specs', 'Frontage', 'Gross Taxes', 'Strata Fee', 'Total Parking', 'Year Built']
    .concat(
      Object.keys(relationship_based_attributes)
        .filter(k => !amenities_facilities.includes(k))
        .map(key => key),
    )
    .concat(Object.keys(field_aliases).map(key => key)),
);

export const money_fields = ['price_per_sqft', 'strata_fee', 'gross_taxes'];
export const numeric_fields = ['floor_area', 'floor_area_total', 'floor_area_main'];
export const feeters = ['lot_sqft', 'frontage_feet'];
export const timeframe_fields = ['listed_at'];

const restrictions = ['Pets', 'Age Restrictions'];

const services = ['Connected Services', 'Maintenance Services', 'Security'];

const transit_neighbourhood = ['Places of Interest'];

export default function RxCompareFiltersModal(p: Props) {
  const filterEvent = useEvent(Events.AddPropertyFilter);

  const [selected_filters, setFilters] = React.useState<{ [key: string]: string[] }>({});
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
      'Home Attributes': home_attributes.map((attr, idx) => ({
        value: idx + 1,
        label: attr,
      })),
      'Facilities & Amenenities': amenities_facilities.map((attr, idx) => ({
        value: idx + 1,
        label: attr,
      })),
      Restrictions: restrictions.map((attr, idx) => ({
        value: idx + 1,
        label: attr,
      })),
      Services: services.map((attr, idx) => ({
        value: idx + 1,
        label: attr,
      })),
      Neighbourhood: transit_neighbourhood.map((attr, idx) => ({
        value: idx + 1,
        label: attr,
      })),
    });
  }, []);

  return (
    <div id={p?.id || 'compare-filters-modal'} className={[p.className || ''].join(' ')}>
      <Iterator
        filters={(attributes && Object.keys(attributes as unknown as { [key: string]: unknown })) || []}
        onClick={(evt: React.MouseEvent<HTMLButtonElement>) => {
          handleClick(evt.currentTarget.dataset.key || '');
        }}
        onClose={(evt: React.MouseEvent<HTMLButtonElement>) => {
          document.getElementById('customer-view-modal-compare-filters')?.classList.remove('is-really-visible');
        }}
        category={category}
        selected-filters={selected_filters}
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
                  [c]: selected_filters[c],
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
