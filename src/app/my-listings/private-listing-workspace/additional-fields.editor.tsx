'use client';

import { AgentData } from '@/_typings/agent';
import { PrivateListingInput, PrivateListingModel, PrivateListingOutput } from '@/_typings/private-listing';
import { updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';
import { getPropertyAttributes } from '@/_utilities/api-calls/call-property-attributes';
import { classNames } from '@/_utilities/html-helper';
import SpinningDots from '@/components/Loaders/SpinningDots';
import { Events } from '@/hooks/useFormEvent';
import { Children, MouseEventHandler, ReactElement, SyntheticEvent, cloneElement, useEffect, useState } from 'react';
import MoreFieldsPopup from './components/more-fields.popup';
import useEvent from '@/hooks/useEvent';
import PropertyAttributeInput from './components/property-attribute-input.component';

interface Props {
  children: ReactElement;
  agent: AgentData;
  className?: string;
  disabled?: boolean;
}

function ChipRexifier({
  children,
  ...attr
}: {
  children: ReactElement;
  model: string;
  data: { id: number; name: string };
  onToggle: MouseEventHandler;
  'is-selected'?: boolean;
}) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      return cloneElement(
        c,
        {
          id: `${c.type}-for-${attr.data.name.toLowerCase()}-${attr.data.id}`,
          'data-id': attr.data.id,
          'data-name': attr.data.name,
          'data-model': attr.data.name,
          ...(c.type === 'div'
            ? {
                onClick: attr.onToggle,
                className: classNames(c.props.className, attr['is-selected'] ? 'w--redirected-checked' : ''),
              }
            : {}), // Only listen to div click to avoid multiple handling
          ...(c.type === 'input'
            ? {
                defaultChecked: attr['is-selected'] || false,
              }
            : {}), // Only listen to div click to avoid multiple handling
        },
        c.props.children ? typeof c.props.children === 'string' ? attr.data.name : <ChipRexifier {...attr}>{c.props.children}</ChipRexifier> : undefined,
      );
    }
    return c;
  });
  return <>{Rexified}</>;
}

function Rexifier({
  children,
  ...attributes
}: Props & {
  onAction(action: string): void;
  onChange(
    field: string,
    value:
      | {
          id: number;
          name: string;
        }
      | string
      | number[],
  ): void;
  onToggle(field: string): void;
  listing?: PrivateListingOutput;
  relationships: { [k: string]: { name: string; id: number }[] };
  'fields-shown': string[];
}) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { className = '', 'data-field': field_name, 'data-group': model, 'data-action': action } = c.props;
      className = `rexified ${className}`.trim();
      if (action)
        return (
          <button
            className={c.props.className}
            disabled={attributes.disabled}
            onClick={() => {
              attributes.onAction(action);
            }}
          >
            {attributes.disabled && <SpinningDots className='fill-white w-6 h-6 text-white mr-2' />}
            {c.props.children}
          </button>
        );

      if (attributes.listing && field_name) {
        const { [field_name]: defaultValue } = attributes.listing as unknown as {
          [k: string]: string;
        };
        return cloneElement(c, {
          defaultValue,
          onChange: (evt: SyntheticEvent<HTMLInputElement>) => {
            attributes.onChange(field_name, evt.currentTarget.value);
          },
        });
      }

      if (model) {
        if (attributes.relationships?.[model]) {
          const { [model]: current } = attributes.listing as unknown as { [k: string]: { id: number; name: string }[] };
          return cloneElement(
            c,
            {},
            attributes.relationships[model].map(r =>
              cloneElement(
                c.props.children[0],
                {
                  key: `${model}-${r.id}`,
                },
                <ChipRexifier
                  data={r}
                  is-selected={current.filter(predicate => predicate.id === r.id).length > 0}
                  model={model}
                  onToggle={evt => {
                    attributes.onChange(model as string, evt.currentTarget.getAttribute('data-id') || '');
                  }}
                >
                  {c.props.children[0]}
                </ChipRexifier>,
              ),
            ),
          );
        }
      }

      if (c.props['data-popup'] === 'more_fields') {
        return (
          <MoreFieldsPopup
            {...c.props}
            right-align
            base-only
            hide-defaults
            onChange={ups => {
              if (ups) {
                Object.keys(ups).forEach(field => {
                  if (field === 'parking') attributes.onChange('parkings', ups[field]);
                  else if (field === 'hvac') attributes.onChange('hvacs', ups[field]);
                  else {
                    console.log(field, ups[field]);
                    // attributes.onChange(field, '');
                  }
                });
              }
            }}
          >
            {c.props.children}
          </MoreFieldsPopup>
        );
      }

      if (c.type === 'form') {
        const field_group = c.props.children;
        const values = attributes.listing as unknown as {
          [k: string]: string | number;
        };
        return cloneElement(
          c,
          {},
          <>
            {field_group}
            <div className='flex gap-x-[4%] gap-y-4 flex-wrap mt-4'>
              {attributes['fields-shown']
                .sort((a, b) => {
                  // Sort the input fields alphabetically
                  if (a > b) return 1;
                  else if (a < b) return -1;
                  return 0;
                })
                .map(field => (
                  <PropertyAttributeInput
                    onChange={(name: string, value: any) => {
                      attributes.onChange(name, value);
                    }}
                    key={field}
                    name={field}
                    defaultValue={values[field]}
                  />
                ))}
            </div>
          </>,
        );
      }

      if (c.props.children && typeof c.props.children !== 'string')
        return cloneElement(c, { className }, <Rexifier {...attributes}>{c.props.children}</Rexifier>);
      return cloneElement(c, { className });
    }
    return c;
  });
  return <>{Rexified}</>;
}

const OTHER_FIELDS = [
  'exterior_finish',
  'fireplace',
  'total_fireplaces',
  'total_covered_parking',
  'foundation_specs',
  'total_allowed_rentals',
  'building_bylaws',
  'total_pets_allowed',
  'total_cats_allowed',
  'total_dogs_allowed',
  'num_units_in_community',
  'complex_compound_name',
  'video_link',
  'floor_levels',
  'floor_area_below_main',
  'frontage_feet',
];

export function MyListingsAdditionalFieldsEditor({ children, ...attributes }: Props & { listing?: PrivateListingModel }) {
  const { data: more } = useEvent(Events.AddPropertyFilter);
  const { filters = [] } = more as unknown as {
    filters: string[];
  };
  if (attributes.listing) {
    const fields = attributes.listing as unknown as {
      [k: string]: any;
    };
    Object.keys(fields).forEach(field => {
      if (OTHER_FIELDS.includes(field) && fields[field]) {
        if (!filters.includes(field)) {
          filters.push(field);
        }
      }
    });
  }
  const [relations, setRelations] = useState<{
    [k: string]: number[];
  }>();
  const [data, setData] = useState<PrivateListingInput | undefined>(
    attributes?.listing
      ? {
          id: attributes.listing.id,
        }
      : {},
  );
  const [relationships, setPropertyRelationships] = useState<{ [k: string]: { name: string; id: number }[] }>();
  const [is_loading, toggleLoading] = useState<boolean>(false);

  function handleAction(action: string) {
    if (data) {
      const { id, ...record } = data;

      if (action === 'next' && id && record) {
        toggleLoading(true);
        updatePrivateListing(id, record)
          .then(() => {
            const next_tab = document.querySelector('a[data-w-tab="Tab 8"]') as HTMLAnchorElement;
            if (next_tab) next_tab.click();
          })
          .finally(() => {
            toggleLoading(false);
          });
      }
    }
  }

  useEffect(() => {
    getPropertyAttributes().then(setPropertyRelationships);
  }, []);

  return (
    <Rexifier
      {...attributes}
      listing={attributes.listing as unknown as PrivateListingOutput}
      relationships={relationships || {}}
      disabled={is_loading}
      onAction={handleAction}
      onToggle={field => {
        const v = data as unknown as { [k: string]: boolean };
        setData({
          ...data,
          [field]: v[field] ? false : true,
        });
      }}
      onChange={(field, value: string | number[]) => {
        if (typeof value === 'string' || typeof value === 'number')
          setData({
            ...data,
            [field]: isNaN(Number(value)) ? value : Number(value),
          });
        else
          setRelations({
            ...relations,
            [field]: value,
          });
      }}
      fields-shown={filters || []}
    >
      {children}
    </Rexifier>
  );
}
