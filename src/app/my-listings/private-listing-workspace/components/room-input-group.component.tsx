import { RoomDetails } from '@/_typings/property';
import { Children, ReactElement, cloneElement, ChangeEvent } from 'react';
function Rexifier({ children, ...props }: { children: ReactElement; room: RoomDetails; onChange(field: string, value: string): void }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children) {
      if (typeof c.props.children !== 'string') {
        return cloneElement(c, { 'data-rx': '' }, <Rexifier {...props}>{c.props.children}</Rexifier>);
      }
    }
    if (c.props.placeholder === 'Room Name') {
      return cloneElement(c, {
        defaultValue: props.room.type,
        onChange: (evt: ChangeEvent<HTMLInputElement>) => {
          props.onChange('type', evt.currentTarget.value);
        },
      });
    }
    if (c.props.placeholder === 'Level') {
      return cloneElement(c, {
        defaultValue: props.room.level,
        onChange: (evt: ChangeEvent<HTMLInputElement>) => {
          props.onChange('level', evt.currentTarget.value);
        },
      });
    }
    if (c.props.placeholder === 'Dimensions 1') {
      return cloneElement(c, {
        defaultValue: props.room.width,
        onChange: (evt: ChangeEvent<HTMLInputElement>) => {
          props.onChange('width', evt.currentTarget.value);
        },
      });
    }
    if (c.props.placeholder === 'Dimensions 2') {
      return cloneElement(c, {
        defaultValue: props.room.length,
        onChange: (evt: ChangeEvent<HTMLInputElement>) => {
          props.onChange('length', evt.currentTarget.value);
        },
      });
    }
    return c;
  });
  return <>{Rexified}</>;
}
export default function RoomInputGroupRexifier({
  children,
  onChange,
  ...props
}: {
  children: ReactElement;
  room: RoomDetails;
  onChange(updated: RoomDetails): void;
}) {
  return (
    <Rexifier
      {...props}
      onChange={(name, value) => {
        onChange({
          ...props.room,
          [name]: value,
        });
      }}
    >
      {children}
    </Rexifier>
  );
}
