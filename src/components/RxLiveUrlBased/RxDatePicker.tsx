import React from 'react';
import styles from './RxDatePicker.module.scss';
import Calendar from 'react-calendar';

interface DatePickerProps {
  className: string;
  filter: string;
  placeholder?: string;
  maxvalue?: Date;
  minvalue?: Date;
}

function getDate(dt: Date) {
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'long' }).format(dt as unknown as Date);
}

export default function RxDatePicker(p: DatePickerProps) {
  const [opened, toggleCalendar] = React.useState(false);
  const [value, onChange] = React.useState(new Date());
  const month_ref = React.useRef(null);
  const year_ref = React.useRef(null);

  return (
    <div className={`w-input text-field-9 ${styles['date-picker']}`}>
      <button
        type='button'
        className='w-5 h-5 bg-transparent cursor-pointer z-20 absolute'
        onClick={() => {
          toggleCalendar(!opened);
        }}
      ></button>
      <input
        type='text'
        className='p-0 w-6 ml-1 mr-1'
        placeholder={`${new Date().getDate()}`}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          const code = e.code.toLowerCase();
          if (
            !e.metaKey &&
            isNaN(Number(e.key)) &&
            code.indexOf('backspace') === -1 &&
            code.indexOf('delete') === -1 &&
            code.indexOf('enter') === -1 &&
            code.indexOf('tab') === -1 &&
            code.indexOf('left') === -1 &&
            code.indexOf('right') === -1 &&
            code.indexOf('up') === -1 &&
            code.indexOf('down') === -1
          ) {
            e.preventDefault();
          }
        }}
        onChange={e => {
          if (e.target.value.length > 1) {
            e.target.blur();
            if (month_ref) {
              const input = month_ref as any;
              input.current.focus();
            }
          }
        }}
        defaultValue={value.getDate()}
      />
      /
      <input
        type='text'
        className='p-0 w-6'
        placeholder={`${new Date().getMonth() + 1}`}
        ref={month_ref}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          const code = e.code.toLowerCase();
          if (
            !e.metaKey &&
            isNaN(Number(e.key)) &&
            code.indexOf('backspace') === -1 &&
            code.indexOf('delete') === -1 &&
            code.indexOf('enter') === -1 &&
            code.indexOf('tab') === -1 &&
            code.indexOf('left') === -1 &&
            code.indexOf('right') === -1 &&
            code.indexOf('up') === -1 &&
            code.indexOf('down') === -1
          ) {
            console.log(e.key, e.code);
            e.preventDefault();
          }
        }}
        onChange={e => {
          if (e.target.value.length > 1) {
            e.target.blur();
            if (year_ref) {
              const input = year_ref as any;
              input.current.focus();
            }
          }
        }}
        defaultValue={value.getMonth() + 1}
      />
      /
      <input
        type='text'
        className='p-0 w-10 ml-1'
        ref={year_ref}
        placeholder={`${new Date().getFullYear()}`}
        onKeyDown={(e: React.KeyboardEvent) => {
          const code = e.code.toLowerCase();
          if (
            !e.metaKey &&
            isNaN(Number(e.key)) &&
            code.indexOf('backspace') === -1 &&
            code.indexOf('delete') === -1 &&
            code.indexOf('enter') === -1 &&
            code.indexOf('tab') === -1 &&
            code.indexOf('left') === -1 &&
            code.indexOf('right') === -1 &&
            code.indexOf('up') === -1 &&
            code.indexOf('down') === -1
          ) {
            console.log(e.key, e.code);
            e.preventDefault();
          }
        }}
        defaultValue={value.getFullYear()}
      />
      <Calendar
        className={`${styles['calendar-modal']} ${opened ? '' : 'hidden'}`}
        tileClassName={styles['calendar-tile']}
        maxDate={p.maxvalue}
        minDate={p.minvalue}
        onClickDay={(val: Date) => {
          onChange(val);
          toggleCalendar(false);
        }}
      />
    </div>
  );
}
