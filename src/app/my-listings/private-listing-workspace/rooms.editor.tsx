'use client';

import { AgentData } from '@/_typings/agent';
import { PrivateListingInput, PrivateListingModel } from '@/_typings/private-listing';
import { BathroomDetails, FinanceFields, NumericFields, RoomDetails } from '@/_typings/property';
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
      if (c.props.children && typeof c.props.children !== 'string')
        return cloneElement(c, { className }, <Rexifier {...attributes}>{c.props.children}</Rexifier>);
      return cloneElement(c, { className });
    }
    return c;
  });
  return <>{Rexified}</>;
}

export function MyListingsRoomsEditor({ children, ...attributes }: Props) {
  const form = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  const [data, setData] = useState<PrivateListingInput | undefined>(attributes.listing || {});
  const [is_loading, toggleLoading] = useState<boolean>(false);
  const [room_details, setRoomDetails] = useState<{
    rooms: RoomDetails[];
  }>({ rooms: [] });
  const [bathroom_details, setBathroomDetails] = useState<{
    baths: BathroomDetails[];
  }>({ baths: [] });

  function handleAction(action: string) {
    if (form.data) {
      const { id, beds_dimensions, baths_full_dimensions } = form.data;

      if (action === 'next' && id) {
        toggleLoading(true);

        // updatePrivateListing(id, {
        //   baths,
        //   beds,
        //   full_baths,
        //   half_baths,
        //   floor_area,
        //   lot_area,
        //   floor_area_uom,
        //   lot_uom,
        //   total_additional_rooms,
        //   total_kitchens,
        //   garages,
        // })
        //   .then(() => {
        //     const next_tab = document.querySelector('a[data-w-tab="Tab 6"]') as HTMLAnchorElement;
        //     next_tab.click();
        //   })
        //   .finally(() => {
        //     toggleLoading(false);
        //   });
      }
    }
  }
  console.log(data);
  useEffect(() => {
    if (data?.room_details) {
      setRoomDetails(data.room_details);
    }
    if (data?.bathroom_details) {
      setBathroomDetails(data.bathroom_details);
    }
  }, []);

  useEffect(() => {
    if (data) form.fireEvent(data as unknown as PrivateListingData);
  }, [data]);

  return (
    <Rexifier
      {...attributes}
      disabled={is_loading}
      onAction={handleAction}
      onChange={(field, value: string) => {
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
