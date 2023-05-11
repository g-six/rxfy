import { MLSProperty } from '@/_typings/property';
import React, { useEffect } from 'react';
import styles from './MortgageCalculator.module.scss';

const options = [
  { value: 5, name: '5 Years' },
  { value: 10, name: '10 Years' },
  { value: 15, name: '15 Years' },
  { value: 20, name: '20 Years' },
  { value: 25, name: '25 Years' },
  { value: 30, name: '30 Years' },
];

export function isNumeric(value: string) {
  return /^-?\d+$/.test(value);
}

function formatCurrency(val: number) {
  const text = Intl.NumberFormat('en-CA').format(val);
  let [whole, fraction] = text.split('.');
  if (!whole) whole = '0';
  if (!fraction || fraction.length < 2) {
    fraction = `${fraction}0`;
  }
  return `${whole}.${fraction}`;
}

function roundUpFinance(num: number) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export default function MortgageCalculator({ property }: { property: MLSProperty }) {
  const [state, setState] = React.useState({
    price: property.AskingPrice,
    formattedPrice: property.AskingPrice ? formatCurrency(property.AskingPrice) : 0,
    formattedDownpayment: property.AskingPrice ? formatCurrency(property.AskingPrice * 0.05) : 0,
    downpayment: property.AskingPrice ? property.AskingPrice * 0.05 : 0,
    downpaymentPct: 5,
    rate: 8,
    years: 30,
  });

  const [inputState, setInputState] = React.useState({
    downpayment: '',
  });

  const getMonthlyPaymentAmount = () => {
    if (state.price && state.downpayment) {
      const monthlyInterestRate = state.rate / 100 / 12;
      const numberOfPayments = state.years * 12;
      const monthlyPayment =
        ((state.price - state.downpayment) * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
      return `$ ${formatCurrency(roundUpFinance(monthlyPayment))}`;
    }
    return '';
  };

  const inputFocused = (e: React.FocusEvent<HTMLInputElement>) => {
    if (['downpayment', 'downpaymentPct'].indexOf(e.currentTarget.name) >= 0) {
      setInputState({
        ...inputState,
        downpayment: 'focused',
      });
    }
  };

  const inputBlurred = (e: React.FocusEvent<HTMLInputElement>) => {
    if (['downpayment', 'downpaymentPct'].indexOf(e.currentTarget.name) >= 0) {
      setInputState({
        ...inputState,
        downpayment: '',
      });
    }
  };

  const inputModified = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (isNumeric(e.currentTarget.value)) {
      if (key === 'downpayment') {
        const downpaymentPct = e.currentTarget.value && state.price ? roundUpFinance((parseFloat(e.currentTarget.value) / state.price) * 100) : 0;
        setState({
          ...state,
          downpaymentPct,
          formattedDownpayment: formatCurrency(parseFloat(e.currentTarget.value)),
          downpayment: parseFloat(e.currentTarget.value),
        });
      } else if (key === 'downpaymentPct') {
        const dp = state.price * (parseFloat(e.currentTarget.value) / 100);
        setState({
          ...state,
          downpaymentPct: roundUpFinance(parseFloat(e.currentTarget.value)),
          formattedDownpayment: formatCurrency(dp),
          downpayment: dp,
        });
      } else if (key === 'price') {
        setState({
          ...state,
          formattedPrice: formatCurrency(parseFloat(e.currentTarget.value)),
          price: parseFloat(e.currentTarget.value),
        });
      } else {
        setState({
          ...state,
          [key]: Number(e.currentTarget.value),
        });
      }
    } else {
      setState({
        ...state,
        [key]: 0,
      });
    }
  };
  const selectedOption = (e: React.ChangeEvent<HTMLSelectElement>, key: string) => {
    setState({
      ...state,
      [key]: Number(e.currentTarget.value),
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.fieldset}>
        <label htmlFor='price' className='block text-sm font-medium text-gray-700'>
          Price
        </label>
        <div>
          <div className={styles.prefix}>
            <span>$</span>
          </div>
          <input
            type='text'
            className={styles.price}
            id='price'
            name='price'
            onChange={e => {
              inputModified(e, e.target.name);
            }}
            defaultValue={state.formattedPrice}
          />
        </div>
      </div>

      <div className={styles.valueAndPercentageCombo}>
        <div className={styles.fieldset}>
          <label htmlFor='downpayment' className='block text-sm font-medium text-gray-700'>
            Downpayment
          </label>
          <div className={inputState.downpayment}>
            <div className={styles.prefix}>
              <span>$</span>
            </div>
            <input
              type='text'
              className={styles.downpayment}
              id='downpayment'
              name='downpayment'
              onChange={e => {
                inputModified(e, e.target.name);
              }}
              onFocus={inputFocused}
              onBlur={inputBlurred}
              value={state.downpayment}
            />
            <input
              type='text'
              className={styles['downpayment-percentage']}
              id='downpaymentPct'
              name='downpaymentPct'
              onFocus={inputFocused}
              onBlur={inputBlurred}
              onChange={e => {
                inputModified(e, e.target.name);
              }}
              value={state.downpaymentPct}
            />
            <div className={styles.suffix}>
              <span>%</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles['mortgage-term-wrapper']}>
        {/* <Select
          onChange={(e) => {
            selectedOption(e, 'years');
          }}
          value={state.years}
          options={options}
          label={'Mortgage Term'}
        /> */}
      </div>

      <div className={[styles.fieldset, styles['rate-fieldset'] || ''].join(' ')}>
        <label htmlFor='rate' className='block text-sm font-medium text-gray-700'>
          Int.
        </label>
        <div>
          <input
            type='text'
            className={styles.rate}
            id='rate'
            name='rate'
            onChange={e => {
              inputModified(e, e.target.name);
            }}
            defaultValue={state.rate}
          />
          <div className={styles.suffix}>
            <span>%</span>
          </div>
        </div>
      </div>

      <div className={styles.calculatedValue}>
        <span className={styles.label}>Monthly Payment</span>
        <div className={styles.value}>{getMonthlyPaymentAmount()}</div>
      </div>
    </div>
  );
}
