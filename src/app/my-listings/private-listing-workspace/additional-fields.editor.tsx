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
import MoreFieldsPopup from './components/more-fields.popup';

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
                checked: attr['is-selected'] || false,
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
            onChange={ups => {
              if (ups) {
                Object.keys(ups).forEach(field => {
                  if (field === 'parking') attributes.onChange('parkings', ups[field]);
                  else if (field === 'hvac') attributes.onChange('hvacs', ups[field]);
                  else attributes.onChange(field, ups[field]);
                });
              }
            }}
          >
            {c.props.children}
          </MoreFieldsPopup>
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

export function MyListingsAdditionalFieldsEditor({ children, ...attributes }: Props & { listing?: PrivateListingModel }) {
  const form = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  const { facilities } = attributes.listing as unknown as PrivateListingOutput;
  const [relations, setRelations] = useState<{
    [k: string]: number[];
  }>();
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
        const { appliances, hvacs, parkings, places_of_interest } = record;
        updatePrivateListing(id, {
          ...relations,
        })
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
        if (typeof value === 'string')
          setData({
            ...data,
            [field]: value,
          });
        else
          setRelations({
            ...relations,
            [field]: value,
          });
      }}
    >
      {children}
    </Rexifier>
  );
}
