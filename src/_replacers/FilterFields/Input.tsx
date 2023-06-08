import { InputPropsInterface } from '@/_typings/ui-types';
import React, { FocusEvent, FocusEventHandler, ReactElement } from 'react';

type Props = {
  template: ReactElement;
  inputProps?: InputPropsInterface;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Input({ template, inputProps, value, onChange }: Props) {
  const handleBlur: FocusEventHandler<HTMLInputElement> | undefined = event => {
    inputProps?.onBlur?.(event as React.FocusEvent<HTMLInputElement, Element>);
  };

  const isNumber = inputProps?.type === 'number';
  value = isNumber && !value ? '' : value;

  return <input className={template.props.className} value={value} onChange={onChange} onBlur={handleBlur} {...(inputProps || {})} />;
}
