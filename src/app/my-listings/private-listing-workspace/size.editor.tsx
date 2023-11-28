'use client';

import { AgentData } from '@/_typings/agent';
import { PrivateListingInput, PrivateListingModel } from '@/_typings/private-listing';
import { FinanceFields, NumericFields } from '@/_typings/property';
import { updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';
import SpinningDots from '@/components/Loaders/SpinningDots';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { Children, MouseEvent, ReactElement, SyntheticEvent, cloneElement, useEffect, useState } from 'react';

interface Props {
  children: ReactElement;
  agent: AgentData;
  listing?: PrivateListingModel;
  className?: string;
  disabled?: boolean;
}

function UOMRexifier({
  children,
  ...attributes
}: Props & {
  onChange(
    field: string,
    value:
      | {
          id: number;
          name: string;
        }
      | string,
  ): void;
  'field-name': string;
}) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { className = '', 'data-value': uom_value, 'data-group': model } = c.props;
      className = `rexified ${className}`.trim();

      if (uom_value) {
        return cloneElement(c, {
          onClick: (evt: MouseEvent<HTMLAnchorElement>) => {
            switch (evt.currentTarget.text.toUpperCase()) {
              case 'SQ M':
                attributes.onChange(attributes['field-name'], 'sqm');
                break;
              default:
                attributes.onChange(attributes['field-name'], evt.currentTarget.text.toLowerCase());
                break;
            }

            const comp = document.querySelector(`[data-field="${attributes['field-name']}"] div:last-child`);
            document.querySelector('.dropdown-list.w--open')?.classList.remove('w--open');
            if (comp) {
              comp.textContent = evt.currentTarget.text;
            }
          },
        });
      }

      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(c, {}, <UOMRexifier {...attributes}>{c.props.children}</UOMRexifier>);
      }
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
}) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { className = '', 'data-field': field_name, 'data-value': uom_value, 'data-group': model, 'data-action': action } = c.props;
      className = `rexified ${className}`.trim();
      if (action)
        return (
          <button
            data-action={action}
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
      if (field_name?.includes('_uom')) {
        return cloneElement(
          c,
          {},
          <UOMRexifier field-name={field_name} {...attributes}>
            {c.props.children}
          </UOMRexifier>,
        );
      }

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
      if (c.props.children && typeof c.props.children !== 'string')
        return cloneElement(c, { className }, <Rexifier {...attributes}>{c.props.children}</Rexifier>);
      return cloneElement(c, { className });
    }
    return c;
  });
  return <>{Rexified}</>;
}

export function MyListingsSizeEditor({ children, ...attributes }: Props) {
  const form = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  const [data, setData] = useState<PrivateListingInput | undefined>(attributes.listing || {});
  const [is_loading, toggleLoading] = useState<boolean>(false);

  function handleAction(action: string) {
    if (form.data) {
      const { id, ...values } = form.data;

      if (action === 'next' && data?.id) {
        toggleLoading(true);

        updatePrivateListing(data.id, {
          baths: values.baths || undefined,
          beds: values.beds || undefined,
          full_baths: values.full_baths || undefined,
          half_baths: values.half_baths || undefined,
          floor_area: values.floor_area || undefined,
          lot_area: values.lot_area || undefined,
          floor_area_uom: values.floor_area_uom || undefined,
          lot_uom: values.lot_uom || undefined,
          total_additional_rooms: values.total_additional_rooms || undefined,
          total_kitchens: values.total_kitchens || undefined,
          total_garage: values.garages || undefined,
          garages: values.garages || undefined,
        })
          .then(() => {
            const next_tab = document.querySelector('a[data-w-tab="Tab 5"]') as HTMLAnchorElement;
            next_tab.click();
          })
          .finally(() => {
            toggleLoading(false);
          });
      }
    }
  }

  useEffect(() => {
    const floor_area_uom = document.querySelector(`[data-field="floor_area_uom"] div:last-child`);
    if (floor_area_uom && data?.floor_area_uom) floor_area_uom.textContent = data?.floor_area_uom;

    const lot_uom = document.querySelector(`[data-field="lot_uom"] div:last-child`);
    if (lot_uom && data?.lot_uom) lot_uom.textContent = data?.lot_uom;
  }, []);

  return (
    <Rexifier
      {...attributes}
      disabled={is_loading}
      onAction={handleAction}
      onChange={(field, value: string) => {
        if (field === 'garages') {
          form.fireEvent({
            garages: Number(value || 0),
            total_garage: Number(value || 0),
          });
          setData({
            ...data,
            total_garage: Number(value || 0),
          });
        }
        form.fireEvent({
          [field]: FinanceFields.concat(NumericFields).includes(field) ? Number(value) : value,
        });
        setData({
          ...data,
          [field]: FinanceFields.concat(NumericFields).includes(field) ? Number(value) : value,
        });
      }}
    >
      {children}
    </Rexifier>
  );
}
