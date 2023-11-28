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
          const rooms = attributes.data.room_details?.others || [];
          if (rooms.length === 0 && attributes.data.total_additional_rooms) {
            Array.from({ length: attributes.data.total_additional_rooms }, () => {
              return {
                type: c.props['data-input-group'],
                length: '',
                width: '',
                level: 'main',
              };
            }).forEach(i => rooms.push(i));
          }
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
          const rooms = attributes.data.room_details?.kitchens || [];
          if (rooms.length === 0 && attributes.data.total_kitchens) {
            Array.from({ length: attributes.data.total_kitchens }, () => {
              return {
                type: c.props['data-input-group'],
                length: '',
                width: '',
                level: 'main',
              };
            }).forEach(i => rooms.push(i));
          }
          return rooms ? (
            <>
              {rooms.map((r, i) =>
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
          const garages = attributes.data.room_details?.garages || [];
          if (garages.length === 0 && attributes.data.total_garage) {
            Array.from({ length: attributes.data.total_garage }, () => {
              return {
                type: c.props['data-input-group'],
                length: '',
                width: '',
                level: 'main',
              };
            }).forEach(i => garages.push(i));
          }
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
    if (data?.id) {
      if (action === 'next' && data) {
        toggleLoading(true);
        const { room_details, bathroom_details } = data;

        updatePrivateListing(data.id, {
          room_details,
          bathroom_details,
        })
          .then(() => {
            const next_tab = document.querySelector('a[data-w-tab="Tab 6"]') as HTMLAnchorElement;
            next_tab.click();
          })
          .finally(() => {
            toggleLoading(false);
          });
      }
    }
  }

  function updateData() {
    const bathroom_details = data?.bathroom_details || { baths: [] };
    let room_details = data?.room_details || { rooms: [] };

    let beds = form.data?.beds || data?.beds || 0;
    let baths = form.data?.baths || data?.baths || 0;
    let total_kitchens = form.data?.total_kitchens || data?.total_kitchens || 0;
    let total_garage = form.data?.total_garage || data?.total_garage || 0;
    let total_additional_rooms = form.data?.total_additional_rooms || data?.total_additional_rooms || 0;

    room_details = {
      ...room_details,
      others: room_details.others || [],
      garages: room_details.garages || [],
      kitchens: room_details.kitchens || [],
    };

    if (baths && bathroom_details.baths) {
      if (bathroom_details.baths.length < baths)
        for (let cnt = baths - bathroom_details.baths.length; cnt > 0; cnt--) {
          bathroom_details.baths.push({
            pieces: 1,
            level: 'Main',
          });
        }
      else if (bathroom_details.baths.length > baths) bathroom_details.baths.splice(baths);
    }
    if (beds && room_details.rooms) {
      if (room_details.rooms.length < beds)
        for (let cnt = beds - room_details.rooms.length; cnt > 0; cnt--) {
          room_details.rooms.push({
            type: 'Bedroom',
            length: '',
            width: '',
            level: 'Main',
          });
        }
      else if (room_details.rooms.length > beds) room_details.rooms.splice(beds);
    }

    if (total_kitchens && room_details.kitchens) {
      if (room_details.kitchens.length < total_kitchens)
        for (let cnt = total_kitchens - room_details.kitchens.length; cnt > 0; cnt--) {
          room_details.kitchens.push({
            type: 'Kitchen',
            length: '',
            width: '',
            level: 'Main',
          });
        }
      else if (room_details.kitchens.length > total_kitchens) room_details.kitchens.splice(total_kitchens);
    }

    if (total_garage && room_details.garages) {
      if (room_details.garages.length < total_garage)
        for (let cnt = total_garage - room_details.garages.length; cnt > 0; cnt--) {
          room_details.garages.push({
            type: 'Garage',
            length: '',
            width: '',
            level: 'Ground',
          });
        }
      else if (room_details.garages.length > total_garage) {
        room_details.garages.splice(total_garage);
      }
    }
    if (total_additional_rooms && room_details.others && room_details.others.length < total_additional_rooms) {
      for (let cnt = total_additional_rooms - room_details.others.length; cnt > 0; cnt--) {
        room_details.others.push({
          type: '',
          length: '',
          width: '',
          level: 'Ground',
        });
      }
    }
    return {
      ...data,
      room_details,
      bathroom_details,
    };
  }

  useEffect(() => {
    setData(updateData());
  }, [form.data]);

  useEffect(() => {
    setData(updateData());
  }, []);

  return data?.bathroom_details && data?.room_details ? (
    <Rexifier {...attributes} disabled={is_loading} onAction={handleAction} data={data} onChangeRoom={onChangeRoom} onChangeBathroom={onBathroomUpdate}>
      {children}
    </Rexifier>
  ) : (
    <></>
  );
}
