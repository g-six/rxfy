import { InputPropsInterface } from '@/_typings/ui-types';
import React, { FocusEvent, FocusEventHandler, ReactElement } from 'react';
import { LISTING_MONEY_FIELDS } from '@/_utilities/data-helpers/listings-helper';

type Props = {
  template: ReactElement;
  inputProps?: InputPropsInterface;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Input({ template, inputProps, value, onChange }: Props) {
  const handleBlur: FocusEventHandler<HTMLInputElement> | undefined = event => {
    inputProps?.onBlur?.(event as React.FocusEvent<HTMLInputElement, Element>);
    if (inputProps?.name && LISTING_MONEY_FIELDS.includes(inputProps.name)) {
      event.currentTarget.value = isNaN(Number(value))
        ? `${value || ''}`
        : `$${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value as string))}`;
    }
  };

  const isNumber = inputProps?.type === 'number';
  value = isNumber && !value ? undefined : value;

  return <input className={template.props.className} defaultValue={value} onChange={onChange} onBlur={handleBlur} {...(inputProps || {})} type='text' />;
}
