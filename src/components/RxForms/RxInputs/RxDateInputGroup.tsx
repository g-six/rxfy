import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/solid';

export function RxDateInputGroup({
  classOverride,
  field_name,
  default_value,
  onChange,
  icon,
}: {
  classOverride?: string;
  field_name: string;
  default_value?: Date;
  onChange: (val: number) => void;
  icon?: boolean;
}) {
  const [date_value, setDateValue] = React.useState<Date>(default_value ? (default_value as Date) : new Date());

  React.useEffect(() => {
    if (date_value) onChange(date_value.getTime());
  }, [date_value]);

  return (
    <div className={classOverride + ' py-0'}>
      <div className={classOverride ? 'w-full h-full flex items-center' : 'relative rounded-md border-slate-200 border h-12 shadow-sm flex gap-1'}>
        <div className='pointer-events-none inset-y-0 flex items-center left-3 absolute'>
          {icon !== false && <CalendarIcon className='h-6 w-6 text-gray-400' aria-hidden='true' />}
        </div>
        <div className='inset-y-0 flex items-center justify-end'>
          <label htmlFor='day' className='sr-only'>
            Day
          </label>
          <select
            id={`${field_name}_day`}
            name={`${field_name}[]`}
            className='h-full rounded-md border-0 bg-transparent text-gray-500 sm:text-sm focus:outline-none w-20 text-right'
            onChange={evt => {
              const new_value = date_value ? new Date(date_value.getFullYear(), date_value.getMonth(), Number(evt.currentTarget.value)) : new Date();
              new_value.setDate(Number(evt.currentTarget.value));
              setDateValue(new_value);
            }}
            defaultValue={date_value.getDate()}
          >
            {Array.from({ length: new Date(date_value.getFullYear(), date_value.getMonth() + 1, 0).getDate() }, (undefined, y) => {
              return y + 1;
            }).map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className='inset-y-0 flex items-center'>
          <label htmlFor={`${field_name}_month`} className='sr-only'>
            Month
          </label>
          <select
            id={`${field_name}_month`}
            name={`${field_name}[]`}
            className='h-full rounded-md border-0 bg-transparent text-gray-500 sm:text-sm focus:outline-none'
            onChange={evt => {
              const new_value = date_value ? new Date(date_value.getFullYear(), Number(evt.currentTarget.value), Number(evt.currentTarget.value)) : new Date();
              new_value.setMonth(Number(evt.currentTarget.value));
              setDateValue(new_value);
            }}
            defaultValue={date_value.getMonth()}
          >
            {Array.from({ length: 12 }, (undefined, y) => {
              return y;
            }).map(y => (
              <option key={y} value={y}>
                {new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(date_value.getFullYear(), y, 1))}
              </option>
            ))}
          </select>
        </div>
        <div className='inset-y-0 flex items-center'>
          <label htmlFor={`${field_name}_year`} className='sr-only'>
            Year
          </label>
          <select
            id={`${field_name}_year`}
            name={`${field_name}[]`}
            className='h-full rounded-md border-0 bg-transparent text-gray-500 sm:text-sm focus:outline-none'
            onChange={evt => {
              const new_value = date_value ? new Date(Number(evt.currentTarget.value), date_value.getMonth(), date_value.getDate()) : new Date();
              new_value.setFullYear(Number(evt.currentTarget.value));
              setDateValue(new_value);
            }}
            defaultValue={date_value.getFullYear()}
          >
            {Array.from({ length: 82 }, (undefined, y) => {
              return new Date().getFullYear() - y;
            }).map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
