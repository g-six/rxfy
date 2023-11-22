import { BathroomDetails } from '@/_typings/property';
import { ChangeEvent, Children, ReactElement, SyntheticEvent, cloneElement, useEffect, useState } from 'react';

function Rexifier({
  children,
  ...props
}: {
  children: ReactElement;
  bath: BathroomDetails;
  toggleEnsuite(): void;
  onChange(evt: ChangeEvent<HTMLInputElement>): void;
}) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children) {
      if (typeof c.props.children !== 'string') {
        return cloneElement(c, { 'data-rx': '' }, <Rexifier {...props}>{c.props.children}</Rexifier>);
      }
    }
    if (c.props.placeholder === 'Level') {
      return cloneElement(c, { name: 'level', defaultValue: props.bath.level, onChange: props.onChange });
    }
    if (c.props.placeholder === 'Pieces') {
      return cloneElement(c, { name: 'pieces', defaultValue: props.bath.pieces, onChange: props.onChange });
    }
    if (c.type === 'input' && c.props.type === 'checkbox') {
      return cloneElement(c, {
        defaultChecked: props.bath.ensuite === 'yes',
        onChange: () => {
          props.toggleEnsuite();
        },
      });
    }
    if (c.type === 'label' && c.props.className.includes('w-checkbox')) {
      return cloneElement(c, {
        onClick: () => {
          props.toggleEnsuite();
        },
      });
    }
    return c;
  });
  return <>{Rexified}</>;
}
export default function BathroomInputGroupRexifier({
  children,
  onChange,
  ...props
}: {
  children: ReactElement;
  bath: BathroomDetails;
  onChange(updated: BathroomDetails): void;
}) {
  return (
    <Rexifier
      {...props}
      onChange={e => {
        onChange({
          ...props.bath,
          [e.currentTarget.name]: e.currentTarget.value,
        });
      }}
      toggleEnsuite={() => {
        onChange({
          ...props.bath,
          ensuite: props.bath.ensuite === 'yes' ? undefined : 'yes',
        });
      }}
    >
      {children}
    </Rexifier>
  );
}
