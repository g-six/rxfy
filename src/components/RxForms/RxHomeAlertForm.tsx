import React from 'react';
import { getDwellingTypes } from '@/_utilities/api-calls/call-property-attributes';

import styles from './RxForm.module.scss';
import { classNames } from '@/_utilities/html-helper';
import { RxDateInputGroup } from './RxInputs/RxDateInputGroup';
import useEvent, { Events } from '@/hooks/useEvent';
import { CustomerSavedSearch, SavedSearch } from '@/_typings/saved-search';

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
      price?: {
        min?: number;
        max?: number;
      };
      size?: {
        min?: number;
        max?: number;
      };
      listed_at?: number;
      year_built?: number;
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
      updateListedAt: (ts: number) => void;
      updateYear: (year: string) => void;
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
      if (child.props.className?.includes('date-newer-than')) {
        return React.cloneElement(child, {
          ...child.props,
          defaultValue: p.data.year_built || '',
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.actions.updateYear(evt.currentTarget.value);
          },
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
      if (child.props['data-toggle'] === 'datepicker' && !child.props.placeholder?.includes('Year')) {
        return (
          <RxDateInputGroup
            key={child.props.className}
            field_name='date'
            icon={false}
            classOverride={child.props.className + ' w-full'}
            onChange={(ts: number) => {
              p.actions.updateListedAt(ts);
            }}
          />
        );
      }
      if (child.props.className.includes('minprice')) {
        let val = p.data.price?.min || '';
        if (val) val = new Intl.NumberFormat().format(Number(val));
        return React.cloneElement(child, {
          ...child.props,
          defaultValue: val,
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.actions.setMinPrice(evt.currentTarget.value.replace(/\D/g, ''));
          },
        });
      }
      if (child.props.className.includes('maxprice')) {
        let val = p.data.price?.max || '';
        if (val) val = new Intl.NumberFormat().format(Number(val));
        return React.cloneElement(child, {
          ...child.props,
          defaultValue: val,
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.actions.setMaxPrice(evt.currentTarget.value.replace(/\D/g, ''));
          },
        });
      }
      if (child.props.className.includes('sqft-min')) {
        let val = p.data.size?.min || '';
        if (val) val = new Intl.NumberFormat().format(Number(val));
        return React.cloneElement(child, {
          ...child.props,
          defaultValue: val || '',
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.actions.setMinSize(evt.currentTarget.value.replace(/\D/g, ''));
          },
        });
      }
      if (child.props.className.includes('sqft-max')) {
        let val = p.data.size?.max || '';
        if (val) val = new Intl.NumberFormat().format(Number(val));
        return React.cloneElement(child, {
          ...child.props,
          defaultValue: val,
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
  const [listed_at, setListedAt] = React.useState<number>();
  const [year_built, setYearBuilt] = React.useState<number>();
  const [dwelling_filter, setDwellingFilter] = React.useState<string>('');
  const {
    data: { alertData },
  } = useEvent(Events.MyHomeAlertsModal) as unknown as {
    data: {
      alertData: SavedSearch;
    };
  };

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
  const updateListedAt = (val: number) => {
    setListedAt(val);
  };
  const updateYear = (val: string) => {
    setYearBuilt(Number(val));
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
    if (alertData) {
      if (alertData.baths) setBaths(alertData.baths);
      if (alertData.beds) setBeds(alertData.beds);
      if (alertData.maxprice) setMaxPrice(alertData.maxprice as unknown as string);
      if (alertData.minprice) setMinPrice(alertData.minprice as unknown as string);
      if (alertData.minsqft) setMinSize(alertData.minsqft as unknown as string);
      if (alertData.maxsqft) setMaxSize(alertData.maxsqft as unknown as string);
      if (alertData.build_year) setYearBuilt(alertData.build_year as unknown as number);
      if (alertData.dwelling_types?.length) {
        const u = dwelling_types.map(t => {
          if (alertData.dwelling_types?.includes(t.name)) {
            return {
              ...t,
              selected: true,
            };
          }
          return t;
        });
        setDwellingTypes(u);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertData]);

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
          listed_at,
          price,
          size,
          year_built,
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
          updateListedAt,
          updateYear,
        }}
      >
        {p.children}
      </Iterator>
    </div>
  );
}
