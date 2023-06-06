import { FocusEventHandler } from 'react';

export interface ValueInterface {
  label: string;
  value: string | number;
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
  selectedValue: ValueInterface | null | undefined;
  handleSelect: (value: ValueInterface) => void;
  placeholder?: string;
}

export interface RoomDimension {
  name?: string;
  level?: string;
  dimension1?: string;
  dimension2?: string;
  ensuite?: boolean;
}
