/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { TabContentProps } from '@/_typings/agent-my-listings';
import RxCompareFiltersModal, { field_aliases, relationship_based_attributes } from '@/rexify/realtors/crm/RxCompareFiltersModal';
import { getPropertyAttributes } from '@/_utilities/api-calls/call-property-attributes';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { PrivateListingOutput } from '@/_typings/private-listing';
import { LISTING_DATE_FIELDS, LISTING_FIELD_GROUPS, LISTING_PROPER_LABELS, isDateValue, isNumericValue } from '@/_utilities/data-helpers/listings-helper';
import { RxTextInput } from '@/components/RxForms/RxInputs/RxTextInput';
import { RxDateInputGroup } from '@/components/RxForms/RxInputs/RxDateInputGroup';
import styles from '@/rexify/realtors/crm/RxCompareFiltersModal.module.scss';

type Props = { children: React.ReactElement };

const fields_already_in_other_panels = ['Amenities', 'Connected Services', 'Lot Area', 'Flooring', 'Windows', 'Gross Taxes', 'Year Built', 'Strata Fee'];
function Iterator(
  p: Props & {
    updateFilters: (f: { [key: string]: string[] }) => void;
    filters?: string[];
    attributes?: { [key: string]: { name: string; id: number }[] };
    toggleFilter: (value: string | number, field?: string, category?: string) => void;
    selected?: { [key: string]: number[] | string | number | Date };
    onSave: () => void;
  },
) {
  const Wrapped = React.Children.map(p.children, (child, idx) => {
    if (child.type === 'a') {
      return React.cloneElement(child, {
        ...child.props,
        className: child.props.className + ' rexified w-full no-tailwind',
        href: undefined,
        onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
          evt.preventDefault();
          switch (evt.currentTarget.textContent?.toLowerCase()) {
            case 'find more fields':
              document.getElementById('modal-compare-filters')?.classList.add(styles['show-modal']);
              document.getElementById('modal-compare-filters')?.classList.remove('hidden-block');
              break;
            case 'next step':
              p.onSave();
          }
        },
      });
    } else if (child.type === 'form') {
      const grouped_fields: React.ReactElement[] = [];
      if (p.filters) {
        p.filters.forEach(selected_filter => {
          const existing: string[] = [];
          const field_kps: React.ReactElement[] = [];
          if (!p.attributes || !p.attributes[selected_filter]) {
            const label = selected_filter
              .split('_')
              .map((s: string, i: number) => (i === 0 ? capitalizeFirstLetter(s) : s))
              .join(' ');
            if (isDateValue(selected_filter)) {
              grouped_fields.push(
                <div className='mt-4 w-[47%]' key={selected_filter}>
                  <label htmlFor={`${selected_filter}-day`} className='block text-sm font-medium leading-6 text-gray-900'>
                    {label}
                  </label>
                  <RxDateInputGroup
                    key={selected_filter}
                    field_name={selected_filter}
                    default_value={p.selected?.[selected_filter] as Date}
                    onChange={(value: number | string) => {
                      p.toggleFilter(value, selected_filter);
                    }}
                  />
                </div>,
              );
            } else {
              grouped_fields.push(
                <div className='mt-4 w-[47%]' key={selected_filter}>
                  <label htmlFor={`input-${selected_filter}`} className='block text-sm font-medium leading-6 text-gray-900'>
                    {label}
                  </label>
                  <RxTextInput
                    key={selected_filter}
                    field_name={selected_filter}
                    default_value={p.selected?.[selected_filter]}
                    onChange={(value: number | string) => {
                      p.toggleFilter(value, selected_filter);
                    }}
                  />
                </div>,
              );
            }
          } else if (Array.isArray(p.attributes[selected_filter])) {
            p.attributes[selected_filter]
              .filter(attr => !existing.includes(`${attr.id} - ${attr.name}`))
              .forEach(attr => {
                const selected_in_category = (p.selected?.[selected_filter] || []) as number[];
                field_kps.push(
                  <label
                    className={`rounded-full border border-slate-300 ${selected_filter} ${
                      selected_in_category.includes(attr.id) ? 'bg-slate-300' : 'bg-slate-100'
                    }`}
                    key={attr.id}
                    onClick={() => {
                      p.toggleFilter(attr.id, attr.name, selected_filter);
                    }}
                  >
                    <span className='t-filter-label w-form-label'>{attr.name}</span>
                  </label>,
                );
                existing.push(`${attr.id} - ${attr.name}`);
              });
            existing.push(selected_filter);
            grouped_fields.push(
              <>
                <label className='capitalize mt-4 block text-sm font-medium leading-6 text-gray-900'>{selected_filter.split('_').join(' ')}</label>
                <div className='flex flex-row flex-wrap flex-start items-start justify-start gap-x-1'>{field_kps}</div>
              </>,
            );
          }
        });
      }
      return React.cloneElement(child, {
        ...child.props,
        children: (
          <>
            {child.props.children}
            <div className='flex w-full mt-4 flex-wrap gap-1'>{grouped_fields}</div>
          </>
        ),
      });
    } else if (child.type === 'div') {
      if (child.props.id === 'modal-compare-filters') {
        let selected_filters: { [key: string]: string[] } = {};
        if (p.filters && p.attributes) {
          const has_values: string[] = p.filters as string[];
          Object.keys(LISTING_FIELD_GROUPS).forEach((key: string, index: number) => {
            selected_filters = {
              ...selected_filters,
              [LISTING_FIELD_GROUPS[key]]:
                has_values.includes(key) && Array.isArray(selected_filters[LISTING_FIELD_GROUPS[key]])
                  ? [...selected_filters[LISTING_FIELD_GROUPS[key]], LISTING_PROPER_LABELS[key]]
                  : selected_filters[LISTING_FIELD_GROUPS[key]] || [],
            };
          });
        }
        return (
          <RxCompareFiltersModal
            {...child.props}
            selected_filters={selected_filters}
            filters={[]}
            updateFilters={p.updateFilters}
            exclude={fields_already_in_other_panels}
          >
            {child.props.children}
          </RxCompareFiltersModal>
        );
      }
      return (
        <div {...child.props}>
          <Iterator {...p}>{child.props.children}</Iterator>
        </div>
      );
    }

    return child;
  });

  return <>{Wrapped}</>;
}

function getInputFormattedValue(data: PrivateListingOutput, key: string) {
  const denormed_data = data as unknown as { [key: string]: string | number | number[] };
  if (LISTING_DATE_FIELDS.includes(key)) {
    const v = denormed_data[key] as string;
    const [year, month, day] = v.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return denormed_data[key];
}

export default function TabMore({ data, template, nextStepClick }: TabContentProps) {
  const [enabled_fields, setEnabledFields] = React.useState<string[]>([]);
  const [attributes, setAttributes] = React.useState<{ [key: string]: { id: number; name: string }[] }>();
  const [selected_fields, toggleField] = React.useState<{ [key: string]: number[] | string | number | Date }>();
  const updateFilters = (f: { [key: string]: string[] }) => {
    const enable: string[] = [];
    let updated_selection = {
      ...selected_fields,
    };
    Object.keys(f).forEach((category: string) => {
      const labels = f[category];
      labels.forEach(label => {
        let key = '';
        if (relationship_based_attributes[label]) key = relationship_based_attributes[label];
        else if (field_aliases[label]) key = field_aliases[label];
        else key = label.split(' ').join('_').toLowerCase();
        if (key === 'heating_&_ventilation_/_air_conditioning') key = 'hvac';
        enable.push(key);
        if (selected_fields && selected_fields[key]) {
          delete updated_selection[key];
        }
      });
    });
    setEnabledFields(enable);
    toggleField(updated_selection);
  };

  React.useEffect(() => {
    if (attributes) {
      // Let's see if existing data has some of the more-fields-related values
      // and enable / show them on the panel
      const enable: string[] = [];
      let updated_selection = {
        ...selected_fields,
      };
      Object.keys(field_aliases).forEach(field_label => {
        const key = field_aliases[field_label];
        if (data[key]) {
          enable.push(key);
          updated_selection = {
            ...selected_fields,
            [key]: getInputFormattedValue(data, key),
          };
        }
      });
      setEnabledFields(enable);
      toggleField(updated_selection);
    }
  }, [attributes]);

  React.useEffect(() => {
    getPropertyAttributes().then(setAttributes);
  }, []);

  return (
    <div className={styles.TabMore}>
      <Iterator
        updateFilters={updateFilters}
        filters={enabled_fields}
        selected={selected_fields}
        attributes={attributes}
        toggleFilter={(value: number | string, field?: string, category?: string) => {
          if (category && attributes && attributes[category]) {
            // Relationship type
            if (selected_fields && selected_fields[category]) {
              const values = selected_fields[category] as number[];
              const found_index = values.indexOf(value as number);
              if (found_index >= 0) {
                values.splice(found_index, 1);
              } else {
                values.push(value as number);
              }
              toggleField({
                ...selected_fields,
                [category]: values,
              });
            } else {
              toggleField({
                ...selected_fields,
                [category]: [value as number],
              });
            }
          } else if (field) {
            const v = isNumericValue(field) ? Number(value) : value;
            if (!selected_fields) toggleField({ [field]: v });
            else toggleField({ ...selected_fields, [field]: v });
          }
        }}
        onSave={() => {
          nextStepClick(undefined, selected_fields);
        }}
      >
        {template}
      </Iterator>
    </div>
  );
}
