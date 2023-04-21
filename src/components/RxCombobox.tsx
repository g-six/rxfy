'use client';
import React from 'react';
import styles from './RxCombobox.module.scss';
import RxLiveCurrencyDD from './RxLiveUrlBased/RxLiveCurrencyDD';

interface RxComboboxProps {
  className?: string;
  children: React.ReactElement[];
  ['data-value-for']: string;
}

export default function RxCombobox(p: RxComboboxProps) {
  const [opened, toggleOpen] = React.useState(false);

  return (
    <div
      className={`${p['data-value-for']} rexified ${p.className?.split('w-dropdown').join('')} ${styles.RxCombobox} ${opened ? 'w--open' : 'closed'}`}
      onClick={() => {
        toggleOpen(!opened);
      }}
    >
      {p.children?.map((c: React.ReactElement) => {
        const opts: {
          ['aria-expanded']?: 'true' | 'false';
          children?: React.ReactElement;
        } = c.type === 'nav' ? {} : { ['aria-expanded']: opened ? 'true' : 'false' };
        if (c.type === 'nav') {
          if (typeof c.props.children === 'object') {
            opts.children = <RxLiveCurrencyDD child={c.props.children} filter={p['data-value-for']} />;
          }
        }
        return React.cloneElement(c, {
          className: `${c.props.className} rexified-${c.type} ${opened ? 'w--open' : 'closed'}`,
          ...opts,
          onClick: () => {
            toggleOpen(!opened);
          },
        });
      })}
    </div>
  );
}
