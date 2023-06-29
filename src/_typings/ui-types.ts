import { FocusEventHandler } from 'react';

export interface ValueInterface {
  name: string;
  id: number | string;
}

export interface InputPropsInterface {
  type?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  name?: string;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}
export interface SelectPropsInterface {
  values: ValueInterface[];
  selectedValue: ValueInterface | string | null | undefined;
  handleSelect: (value: ValueInterface) => void;
  placeholder?: string;
}

export interface RoomDimension {
  name?: string;
  level?: string;
  width?: string;
  length?: string;
  ensuite?: boolean;
}
