import { useMapMultiUpdater, useMapState } from '@/app/AppContext.module';
import { MapStatePropsWithFilters } from '@/_typings/property';
import React, { ReactNode, useRef, useState } from 'react';
import DatePicker, { CalendarContainer } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import styles from '../../components/RxLiveUrlBased/RxDatePicker.module.scss';

interface DatePickerProps {
  className: string;
  addDate: null | number;
  placeholder?: string;
  setDate: (val: any) => void;
}

export function RxDatePickerContainer() {
  const fn = ({ children, className }: { children: ReactNode; className: string }) => (
    <div style={{ zIndex: 1990 }} className={styles.calendarPopupWrapper}>
      <CalendarContainer className={className}>
        <div style={{ position: 'relative' }}>{children}</div>
      </CalendarContainer>
    </div>
  );

  return fn;
}

function getDate(dt: Date) {
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'long' }).format(dt as unknown as Date);
}

export default function RxDatePickerFilter({ className, placeholder, addDate, setDate }: DatePickerProps) {
  const ref = useRef(null);

  const [is_shown, togglePopup] = useState<boolean>(false);

  const defaultDate = addDate ? format(new Date(addDate * 1000), 'dd/MM/yyyy') : '';

  return (
    <>
      <input
        type='text'
        className={className}
        disabled={is_shown}
        onClick={() => {
          togglePopup(true);
        }}
        ref={ref}
        onBlur={e => {
          togglePopup(false);
        }}
        placeholder={placeholder}
        value={defaultDate}
        onChange={() => {}}
      />

      <DatePicker
        className={className}
        value={defaultDate}
        selected={addDate ? new Date(addDate * 1000) : null}
        onChange={date => {
          if (date !== null) {
            const newDate = new Date(date); // Create a Date object from a date string
            const timestamp = Math.floor(newDate.getTime() / 1000); // Convert date to Unix timestamp in seconds
            setDate(timestamp);
            togglePopup(false);
            // if (ref && ref.current) (ref.current as any).focus();
          }
        }}
        calendarClassName={[styles.calendarPopup, is_shown ? styles.shown : '-top-full -translate-y-full'].join(' ')}
        dayClassName={date => (getDate(date) === getDate(date as unknown as Date) ? styles.selectedDate : '')}
        inline
      />
    </>
  );
}
