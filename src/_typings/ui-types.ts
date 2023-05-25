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
  onBlur?: FocusEventHandler<HTMLInputElement>;
}
export interface SelectPropsInterface {
  values: ValueInterface[];
  selectedValue: ValueInterface | null;
  handleSelect: (value: ValueInterface) => void;
  placeholder?: string;
}
