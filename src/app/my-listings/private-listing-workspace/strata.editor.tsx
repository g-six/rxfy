'use client';

import { AgentData } from '@/_typings/agent';
import { PrivateListingInput, PrivateListingModel, PrivateListingOutput } from '@/_typings/private-listing';
import { FinanceFields, NumericFields } from '@/_typings/property';
import { updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';
import { getPropertyAttributes } from '@/_utilities/api-calls/call-property-attributes';
import { classNames } from '@/_utilities/html-helper';
import SpinningDots from '@/components/Loaders/SpinningDots';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { Children, MouseEvent, MouseEventHandler, ReactElement, SyntheticEvent, cloneElement, useEffect, useState } from 'react';

interface Props {
  children: ReactElement;
  agent: AgentData;
  className?: string;
  disabled?: boolean;
}

function CheckboxRexifier({ children, ...attr }: { children: ReactElement; 'is-checked'?: boolean }) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let replacement = undefined;
      return cloneElement(
        c,
        {
          ...(c.type === 'div'
            ? {
                className: classNames(c.props.className, attr['is-checked'] ? 'w--redirected-checked' : ''),
              }
            : {}), // Only listen to div click to avoid multiple handling
          ...(c.type === 'input'
            ? {
                defaultChecked: attr['is-checked'] || false,
              }
            : {}), // Only listen to div click to avoid multiple handling
        },
        c.props.children ? (
          typeof c.props.children === 'string' ? (
            c.props.children
          ) : (
            <CheckboxRexifier {...attr}>{c.props.children}</CheckboxRexifier>
          )
        ) : undefined,
      );
    }
    return c;
  });
  return <>{Rexified}</>;
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
      let replacement = undefined;
      if (c.props.children) {
        if (typeof c.props.children === 'string') {
          replacement = attr.data.name;
        }
      }
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
      | string,
  ): void;
  onToggle(field: string): void;
  listing?: PrivateListingOutput;
  relationships: { [k: string]: { name: string; id: number }[] };
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
        return cloneElement(
          c,
          {
            defaultValue,
            onChange: (evt: SyntheticEvent<HTMLInputElement>) => {
              if (field_name === 'council_approval_required') {
                attributes.onToggle(field_name);
              } else attributes.onChange(field_name, evt.currentTarget.value);
            },
          },
          field_name === 'council_approval_required' ? (
            <CheckboxRexifier is-checked={defaultValue as unknown as boolean}>{c.props.children}</CheckboxRexifier>
          ) : undefined,
        );
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
      if (c.props.children && typeof c.props.children !== 'string')
        return cloneElement(c, { className }, <Rexifier {...attributes}>{c.props.children}</Rexifier>);
      return cloneElement(c, { className });
    }
    return c;
  });
  return <>{Rexified}</>;
}

export function MyListingsStrataEditor({ children, ...attributes }: Props & { listing?: PrivateListingModel }) {
  const form = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  const { facilities } = attributes.listing as unknown as PrivateListingOutput;
  const [data, setData] = useState<PrivateListingInput | undefined>(
    {
      ...attributes.listing,
      facilities: (facilities || []).map(facility => facility.id),
    } || {},
  );
  const [relationships, setPropertyRelationships] = useState<{ [k: string]: { name: string; id: number }[] }>();
  const [is_loading, toggleLoading] = useState<boolean>(false);

  function handleAction(action: string) {
    if (data) {
      const { id, ...record } = data;

      if (action === 'next' && id && record) {
        toggleLoading(true);

        updatePrivateListing(id, {
          facilities: record.facilities || [],
          strata_fee: isNaN(Number(record.strata_fee)) ? undefined : Number(record.strata_fee),
          building_bylaws: record.building_bylaws,
          restrictions: record.restrictions,
          minimum_age_restriction: record.minimum_age_restriction ? Number(record.minimum_age_restriction) : undefined,
          total_pets_allowed: `${record.total_pets_allowed}` === '' || isNaN(Number(record.total_pets_allowed)) ? undefined : Number(record.total_pets_allowed),
          total_allowed_rentals: isNaN(Number(record.total_allowed_rentals)) ? undefined : Number(record.total_allowed_rentals),
          complex_compound_name: record.complex_compound_name,
          council_approval_required: record.council_approval_required || false,
        })
          .then(() => {
            const next_tab = document.querySelector('a[data-w-tab="Tab 7"]') as HTMLAnchorElement;
            next_tab.click();
          })
          .finally(() => {
            toggleLoading(false);
          });
      }
    }
  }

  useEffect(() => {
    if (data)
      form.fireEvent({
        facilities: (data.facilities || []).map(facility_id => ({
          id: facility_id,
          name: '',
        })),
      });
  }, [data]);

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
      onChange={(field, value: string) => {
        if (data && relationships && Object.keys(relationships).includes(field) && field === 'facilities') {
          const values = (data.facilities || []).map(f => ({
            id: typeof f === 'object' ? (f as { id: number }).id : f,
            name: typeof f === 'object' ? (f as { name: string }).name : f,
          }));
          const index = values.map(f => f.id).indexOf(Number(value));
          if (index >= 0) values.splice(index, 1);
          else
            values.push({
              id: Number(value),
              name: '',
            });
          setData({
            ...data,
            [field]: values.map(v => v.id),
          });
        } else {
          setData({
            ...data,
            [field]: FinanceFields.concat(NumericFields).includes(field) ? Number(value) : value,
          });
        }
      }}
    >
      {children}
    </Rexifier>
  );
}
