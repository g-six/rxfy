import React from 'react';
import styles from '@/components/RxForms/RxInputs/RxDatePicker.module.scss';
import Calendar from 'react-calendar';

interface DatePickerProps {
  className: string;
  name?: string;
  value: number;
  icon?: React.ReactElement;
  onChange: (timestamp: number) => void;
  placeholder?: string;
  maxvalue?: Date;
  minvalue?: Date;
}

export default function DatePickerFilter({ onChange, value, ...p }: DatePickerProps) {
  const [opened, toggleCalendar] = React.useState(false);
  const month_ref = React.useRef(null);
  const year_ref = React.useRef(null);
  const keysToExclude = ['backspace', 'delete', 'enter', 'tab', 'left', 'right', 'up', 'down'];

  return (
    <div className={`w-input text-field-9 ${styles['date-picker']}`}>
      <button
        type='button'
        className={`${p.icon ? 'px-0 flex items-center' : 'w-5 h-5'} bg-transparent cursor-pointer z-20 absolute`}
        onClick={() => {
          toggleCalendar(!opened);
        }}
      >
        {p.icon || ''}
      </button>
      <input
        type='text'
        className='p-0 w-6 ml-1 mr-1'
        placeholder={`${new Date().getDate()}`}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          const code = e.code.toLowerCase();
          if (!e.metaKey && isNaN(Number(e.key)) && keysToExclude.every(key => code.indexOf(key) === -1)) {
            e.preventDefault();
          }
        }}
        onChange={e => {
          const dt = new Date(value);
          dt.setDate(Number(e.target.value));
          onChange(dt.getTime());
          if (e.target.value.length > 1) {
            e.target.blur();
            if (month_ref) {
              const input = month_ref as any;
              input.current.focus();
            }
          }
        }}
        value={new Date(value).getDate()}
      />
      /
      <input
        type='text'
        className='p-0 w-6'
        placeholder={`${new Date().getMonth() + 1}`}
        ref={month_ref}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          const code = e.code.toLowerCase();
          if (!e.metaKey && isNaN(Number(e.key)) && keysToExclude.every(key => code.indexOf(key) === -1)) {
            e.preventDefault();
          }
        }}
        onChange={e => {
          const dt = new Date(value);
          dt.setMonth(Number(e.target.value) - 1);
          onChange(dt.getTime());
          if (e.target.value.length > 1) {
            e.target.blur();
            if (year_ref) {
              const input = year_ref as any;
              input.current.focus();
            }
          }
        }}
        value={new Date(value).getMonth() + 1}
      />
      /
      <input
        type='text'
        className='p-0 w-10 ml-1'
        ref={year_ref}
        placeholder={`${new Date().getFullYear()}`}
        onKeyDown={(e: React.KeyboardEvent) => {
          const code = e.code.toLowerCase();
          if (!e.metaKey && isNaN(Number(e.key)) && keysToExclude.every(key => code.indexOf(key) === -1)) {
            e.preventDefault();
          }
        }}
        onChange={e => {
          const dt = new Date(value);
          if (`${e.target.value}`.length === 4) {
            dt.setFullYear(Number(e.target.value));
            onChange(dt.getTime());
          }
          if (e.target.value.length > 1) {
            e.target.blur();
            if (year_ref) {
              const input = year_ref as any;
              input.current.focus();
            }
          }
        }}
        value={new Date(value).getFullYear()}
      />
      <Calendar
        className={`${styles['calendar-modal']} ${opened ? '' : 'hidden'}`}
        tileClassName={styles['calendar-tile']}
        maxDate={p.maxvalue}
        minDate={p.minvalue}
        value={new Date(value)}
        onClickDay={(val: Date) => {
          onChange(val.getTime());
          toggleCalendar(false);
        }}
      />
    </div>
  );
}
