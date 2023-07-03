import { isNumericValue } from '@/_utilities/data-helpers/listings-helper';
import { capitalizeFirstLetter } from '@/_utilities/formatters';

export function RxTextInput({
  field_name,
  default_value,
  onChange,
}: {
  field_name: string;
  default_value?: number[] | string | number | Date;
  onChange: (val: number | string) => void;
}) {
  const label = field_name
    .split('_')
    .map((s: string, i: number) => (i === 0 ? capitalizeFirstLetter(s) : s))
    .join(' ');

  return (
    <input
      type={isNumericValue(field_name) ? 'number' : 'text'}
      name={field_name}
      id={`input-${field_name}`}
      className='f-field-input w-input'
      placeholder={label}
      defaultValue={`${default_value}`}
      onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
        onChange(evt.currentTarget.value);
      }}
    />
  );
}
