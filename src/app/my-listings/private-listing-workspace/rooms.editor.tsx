'use client';

import { AgentData } from '@/_typings/agent';
import { PrivateListingInput, PrivateListingModel } from '@/_typings/private-listing';
import { BathroomDetails, FinanceFields, NumericFields, RoomDetails } from '@/_typings/property';
import { updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';
import SpinningDots from '@/components/Loaders/SpinningDots';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { Children, MouseEvent, ReactElement, SyntheticEvent, cloneElement, useEffect, useState } from 'react';
import RoomInputGroupRexifier from './components/room-input-group.component';
import BathroomInputGroupRexifier from './components/bath-input-group.component';

interface Props {
  children: ReactElement;
  agent: AgentData;
  listing?: PrivateListingModel;
  className?: string;
  disabled?: boolean;
}

function Rexifier({
  children,
  ...attributes
}: Props & {
  onAction(action: string): void;
  data: PrivateListingInput;
  onChangeRoom(type: 'room' | 'kitchen' | 'garage' | 'other', index: number, updated: RoomDetails): void;
  onChangeBathroom(index: number, updated: BathroomDetails): void;
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

      if (c.props.children && typeof c.props.children !== 'string') {
        if (c.props['data-input-group'] === 'bedroom') {
          return (
            <>
              {(attributes.data.room_details?.rooms || []).map((r, i) =>
                cloneElement(
                  c,
                  {
                    key: `${c.props['data-input-group']}-wrapper-${i}`,
                  },
                  <RoomInputGroupRexifier
                    key={`${c.props['data-input-group']}-input-${i}`}
                    room={r}
                    onChange={(updated: RoomDetails) => {
                      attributes.onChangeRoom('room', i, updated);
                    }}
                  >
                    {c.props.children}
                  </RoomInputGroupRexifier>,
                ),
              )}
            </>
          );
        }
        if (c.props['data-input-group'] === 'additional_room') {
          return attributes.data.room_details?.others ? (
            <>
              {attributes.data.room_details.others.map((r, i) =>
                cloneElement(
                  c,
                  {
                    key: `${c.props['data-input-group']}-wrapper-${i}`,
                  },
                  <RoomInputGroupRexifier
                    key={`${c.props['data-input-group']}-input-${i}`}
                    room={r}
                    onChange={(updated: RoomDetails) => {
                      attributes.onChangeRoom('other', i, updated);
                    }}
                  >
                    {c.props.children}
                  </RoomInputGroupRexifier>,
                ),
              )}
            </>
          ) : (
            <></>
          );
        }
        if (c.props['data-input-group'] === 'kitchen') {
          return attributes.data.room_details?.kitchens ? (
            <>
              {attributes.data.room_details.kitchens.map((r, i) =>
                cloneElement(
                  c,
                  {
                    key: `${c.props['data-input-group']}-wrapper-${i}`,
                  },
                  <RoomInputGroupRexifier
                    key={`${c.props['data-input-group']}-input-${i}`}
                    room={r}
                    onChange={(updated: RoomDetails) => {
                      attributes.onChangeRoom('kitchen', i, updated);
                    }}
                  >
                    {c.props.children}
                  </RoomInputGroupRexifier>,
                ),
              )}
            </>
          ) : (
            <></>
          );
        }
        if (c.props['data-input-group'] === 'garage') {
          return attributes.data.room_details?.garages ? (
            <>
              {attributes.data.room_details.garages.map((r, i) =>
                cloneElement(
                  c,
                  {
                    key: `${c.props['data-input-group']}-wrapper-${i}`,
                  },
                  <RoomInputGroupRexifier
                    key={`${c.props['data-input-group']}-input-${i}`}
                    room={r}
                    onChange={(updated: RoomDetails) => {
                      attributes.onChangeRoom('garage', i, updated);
                    }}
                  >
                    {c.props.children}
                  </RoomInputGroupRexifier>,
                ),
              )}
            </>
          ) : (
            <></>
          );
        }
        if (c.props['data-input-group'] === 'bathroom') {
          return attributes.data.bathroom_details?.baths ? (
            <>
              {attributes.data.bathroom_details.baths.map((r, i) =>
                cloneElement(
                  c,
                  {
                    key: `bath-${i}`,
                  },
                  <BathroomInputGroupRexifier
                    onChange={updated => {
                      attributes.onChangeBathroom(i, updated);
                    }}
                    bath={r}
                  >
                    {c.props.children}
                  </BathroomInputGroupRexifier>,
                ),
              )}
            </>
          ) : (
            <></>
          );
        }

        return cloneElement(c, { className }, <Rexifier {...attributes}>{c.props.children}</Rexifier>);
      }
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

  function onChangeRoom(type: 'room' | 'kitchen' | 'garage' | 'other', index: number, updated: RoomDetails) {
    if (data) {
      let room_details = data.room_details as unknown as { [k: string]: RoomDetails[] };
      const { [`${type}s`]: rooms } = room_details;
      rooms.splice(index, 1, updated);
      room_details = {
        ...room_details,
        [`${type}s`]: rooms,
      };
      setData({
        ...data,
        room_details: {
          rooms: room_details.rooms || [],
          kitchens: room_details.kitchens || [],
          garages: room_details.garages || [],
          others: room_details.others || [],
        },
      });
    }
  }

  function onBathroomUpdate(index: number, updated: BathroomDetails) {
    if (data) {
      const { baths } = data.bathroom_details as unknown as { [k: string]: BathroomDetails[] };
      baths.splice(index, 1, updated);
      setData({
        ...data,
        bathroom_details: {
          baths,
        },
      });
    }
  }

  function handleAction(action: string) {
    if (form.data) {
      const { id, beds_dimensions, baths_full_dimensions } = form.data;

      if (action === 'next' && id) {
        toggleLoading(true);

        // updatePrivateListing(id, {
        //   room_details,
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

  useEffect(() => {
    const bathroom_details = data?.bathroom_details || { baths: [] };
    let room_details = data?.room_details || { rooms: [] };

    let total = data?.beds || 0;
    total = total + (data?.total_additional_rooms || 0);

    room_details = {
      ...room_details,
      others: room_details.others || [],
      garages: room_details.garages || [],
      kitchens: room_details.kitchens || [],
    };

    if (data?.baths && bathroom_details.baths.length < data.baths) {
      for (let cnt = data.baths - bathroom_details.baths.length; cnt > 0; cnt--) {
        bathroom_details.baths.push({
          pieces: 1,
          level: 'Main',
        });
      }
    }
    if (data?.beds && room_details.rooms.length < data.beds) {
      for (let cnt = data.beds - room_details.rooms.length; cnt > 0; cnt--) {
        room_details.rooms.push({
          type: 'Bedroom',
          length: '',
          width: '',
          level: 'Main',
        });
      }
    }

    if (data?.total_kitchens && room_details.kitchens && room_details.kitchens.length < data.total_kitchens) {
      for (let cnt = data.total_kitchens - room_details.kitchens.length; cnt > 0; cnt--) {
        room_details.kitchens.push({
          type: 'Kitchen',
          length: '',
          width: '',
          level: 'Main',
        });
      }
    }
    if (data?.total_garage && room_details.garages && room_details.garages.length < data.total_garage) {
      for (let cnt = data.total_garage - room_details.garages.length; cnt > 0; cnt--) {
        room_details.garages.push({
          type: 'Garage',
          length: '',
          width: '',
          level: 'Ground',
        });
      }
    }
    if (data?.total_additional_rooms && room_details.others && room_details.others.length < data.total_additional_rooms) {
      for (let cnt = data.total_additional_rooms - room_details.others.length; cnt > 0; cnt--) {
        room_details.others.push({
          type: '',
          length: '',
          width: '',
          level: 'Ground',
        });
      }
    }
    setData({
      ...data,
      room_details,
      bathroom_details,
    });
  }, []);

  return data?.bathroom_details && data?.room_details ? (
    <Rexifier {...attributes} disabled={is_loading} onAction={handleAction} data={data} onChangeRoom={onChangeRoom} onChangeBathroom={onBathroomUpdate}>
      {children}
    </Rexifier>
  ) : (
    <></>
  );
}
