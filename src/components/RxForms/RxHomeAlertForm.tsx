import React from 'react';
import { getDwellingTypes } from '@/_utilities/api-calls/call-property-attributes';

import styles from './RxForm.module.scss';
import { classNames } from '@/_utilities/html-helper';
import { RxDateInputGroup } from './RxInputs/RxDateInputGroup';

type Props = {
  children: React.ReactElement;
  className: string;
};

function convertDivsToSpans(el: React.ReactElement) {
  if (el.type === 'div') return <span {...el.props}>{el.props.children}</span>;
  return el;
}

function Chip(p: {
  toggle: (record_id: number) => void;
  'record-id': number;
  name: string;
  checked?: boolean;
  children: React.ReactElement;
  className?: string;
}) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.type === 'span') {
      return (
        <span {...child.props} record-id={p['record-id']}>
          {p.name}
        </span>
      );
    }
    if (child.type === 'div' && p.checked) {
      return React.cloneElement(child, { ...child.props, className: child.props.className + ' w--redirected-checked' });
    }
    return child;
  });
  return (
    <div
      role='button'
      onClick={() => {
        p.toggle(p['record-id']);
      }}
      className={p.className}
    >
      {Wrapped}
    </div>
  );
}

function Iterator(
  p: Props & {
    data: {
      baths?: number;
      beds?: number;
      minsize?: number;
      maxsize?: number;
      dwelling_types: { id: number; name: string; selected?: boolean }[];
    };
    record?: {
      id: number;
      name: string;
    };
    actions: {
      adjustBaths: (i: number) => void;
      adjustBeds: (i: number) => void;
      setMinPrice: (s: string) => void;
      setMaxPrice: (s: string) => void;
      setMinSize: (s: string) => void;
      setMaxSize: (s: string) => void;
      setDwellingFilter: React.Dispatch<React.SetStateAction<string>>;
      toggleSelectedTypes: (id: number) => void;
    };
  },
) {
  const Wrapped = React.Children.map(p.children, child => {
    if (['div', 'form'].includes(child.type as string)) {
      if (child.props.className?.indexOf('div-property-types') >= 0) {
        let chip: React.ReactElement = <></>;
        React.Children.map(child.props.children, (c, idx) => {
          if (idx === 0) chip = c;
        });

        return (
          <div className={child.props.className}>
            {p.data.dwelling_types.map(t => {
              return (
                <Chip {...chip.props} checked={t.selected} record-id={t.id} key={t.id} name={t.name} toggle={p.actions.toggleSelectedTypes}>
                  {chip.props.children}
                </Chip>
              );
            })}
          </div>
        );
      }

      if (child.props.className?.includes('-less') || child.props.className?.includes('-more')) {
        return React.cloneElement(<button type='button' />, {
          ...child.props,
          className: classNames(child.props.className, 'bg-transparent'),
          children: React.Children.map(child.props.children, convertDivsToSpans),
          onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
            if (evt.currentTarget.classList.contains('beds-more')) {
              p.actions.adjustBeds(1);
            }
            if (evt.currentTarget.classList.contains('beds-less')) {
              p.actions.adjustBeds(-1);
            }
            if (evt.currentTarget.classList.contains('baths-more')) {
              p.actions.adjustBaths(1);
            }
            if (evt.currentTarget.classList.contains('baths-less')) {
              p.actions.adjustBaths(-1);
            }
          },
        });
      }

      if (child.props['data-value']) {
        const values = p.data as unknown as {
          [key: string]: number;
        };
        return React.cloneElement(child, {
          ...child.props,
          children: values[child.props['data-value']],
        });
      }

      if (child.props.className === 'proptype-search') {
        return React.cloneElement(child, {
          ...child.props,
          children: (
            <>
              {child.props.children}
              <input
                type='text'
                name='search'
                id='search'
                className={styles['search-input']}
                onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                  p.actions.setDwellingFilter(evt.currentTarget.value);
                }}
              />
            </>
          ),
        });
      }

      return React.cloneElement(child, {
        ...child.props,
        children: (
          <Iterator {...p} className=''>
            {child.props.children}
          </Iterator>
        ),
      });
    }

    if (child.type === 'input') {
      if (child.props.className.includes('minprice')) {
        return React.cloneElement(child, {
          ...child.props,
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.actions.setMinPrice(evt.currentTarget.value.replace(/\D/g, ''));
          },
        });
      }
      if (child.props['data-toggle'] === 'datepicker' && !child.props.placeholder?.includes('Year')) {
        return (
          <RxDateInputGroup
            key={child.props.className}
            field_name='date'
            icon={false}
            classOverride={child.props.className + ' w-full'}
            onChange={(value: number | string) => {
              console.log(value);
              //   p.toggleFilter(value, selected_filter);
            }}
          />
        );
      }
      if (child.props.className.includes('maxprice')) {
        return React.cloneElement(child, {
          ...child.props,
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.actions.setMaxPrice(evt.currentTarget.value.replace(/\D/g, ''));
          },
        });
      }
      if (child.props.className.includes('sqft-min')) {
        return React.cloneElement(child, {
          ...child.props,
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.actions.setMinSize(evt.currentTarget.value.replace(/\D/g, ''));
          },
        });
      }
      if (child.props.className.includes('sqft-max')) {
        return React.cloneElement(child, {
          ...child.props,
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.actions.setMaxSize(evt.currentTarget.value.replace(/\D/g, ''));
          },
        });
      }
    }
    if (child.props?.for === 'Property-Type') {
      return <></>;
    }
    return child;
  });
  return <>{Wrapped}</>;
}

export default function RxHomeAlertForm(p: Props) {
  const [dwelling_types, setDwellingTypes] = React.useState<
    {
      name: string;
      id: number;
      selected?: boolean;
    }[]
  >([]);
  const [baths, setBaths] = React.useState<number>(0);
  const [beds, setBeds] = React.useState<number>(0);
  const [price, setPricing] = React.useState<{ min?: number; max?: number }>({});
  const [size, setSizing] = React.useState<{ min?: number; max?: number }>({});
  const [dwelling_filter, setDwellingFilter] = React.useState<string>('');

  const toggleSelectedTypes = (ptype_id: number) => {
    const updated_dwellings = dwelling_types.map(t => {
      if (ptype_id === t.id) {
        return {
          ...t,
          selected: !t.selected,
        };
      }
      return t;
    });

    setDwellingTypes(updated_dwellings);
  };
  const setMinSize = (val: string) => {
    setSizing({
      ...size,
      min: Number(val),
    });
  };
  const setMaxSize = (val: string) => {
    setSizing({
      ...size,
      max: Number(val),
    });
  };
  const setMinPrice = (val: string) => {
    setPricing({
      ...price,
      min: Number(val),
    });
  };
  const setMaxPrice = (val: string) => {
    setPricing({
      ...price,
      max: Number(val),
    });
  };
  const adjustBeds = (inc: number) => {
    let u = beds + inc;
    if (u < 0) u = 0;
    setBeds(u);
  };
  const adjustBaths = (inc: number) => {
    let u = baths + inc;
    if (u < 0) u = 0;
    setBaths(u);
  };
  React.useEffect(() => {
    getDwellingTypes().then(res => {
      const { types } = res as unknown as {
        types: {
          name: string;
          id: number;
        }[];
      };
      setDwellingTypes(types);
    });
  }, []);

  return (
    <div
      {...p}
      id='RxHomeAlertForm'
      onClick={(evt: React.SyntheticEvent) => {
        /// Fix to modal pre-maturely closing itself.
        evt.stopPropagation();
      }}
    >
      <Iterator
        {...p}
        data={{
          dwelling_types: dwelling_types.filter(t => dwelling_filter.length && t.name.toLowerCase().includes(dwelling_filter.toLowerCase())),
          beds,
          baths,
        }}
        actions={{
          adjustBaths,
          adjustBeds,
          setMinPrice,
          setMaxPrice,
          setMinSize,
          setMaxSize,
          setDwellingFilter,
          toggleSelectedTypes,
        }}
      >
        {p.children}
      </Iterator>
    </div>
  );
}
