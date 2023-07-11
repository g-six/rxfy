import React from 'react';
import SearchAddressCombobox from '@/_replacers/FilterFields/SearchAddressCombobox';
import { getDwellingTypes } from '@/_utilities/api-calls/call-property-attributes';

import { classNames } from '@/_utilities/html-helper';
import { RxDateInputGroup } from './RxInputs/RxDateInputGroup';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import { SavedSearch } from '@/_typings/saved-search';
import { saveSearch, updateSearch } from '@/_utilities/api-calls/call-saved-search';
import { AgentData } from '@/_typings/agent';
import { useSearchParams } from 'next/navigation';

type Props = {
  children: React.ReactElement;
  className: string;
  agent: AgentData;
  customer?: number;
  onSave?: (results: Record<string, unknown>) => void;
};

function convertDivsToSpans(el: React.ReactElement) {
  if (el.type === 'div') return <span {...el.props}>{el.props.children}</span>;
  return el;
}

function IsActiveComponent(p: { className?: string; id?: string; children: React.ReactElement }) {
  const Wrapped = React.Children.map(p.children, child => {
    return convertDivsToSpans(child);
  });

  return <>{Wrapped}</>;
}

function Iterator(
  p: Props & {
    data: {
      city?: string;
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
      is_active?: boolean;
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
      setCityFilter: React.Dispatch<React.SetStateAction<string>>;
      setGeo: (g: { [key: string]: number }) => void;
      toggleActive: (s: boolean) => void;
      toggleSelectedDwellingChip: (classes: DOMTokenList, ptype: string) => void;
      updateListedAt: (ts: number) => void;
      updateYear: (year: string) => void;
      onReset: () => void;
      onSubmit: () => void;
    };
  },
) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.className?.includes('marketing-consent')) {
      return <IsActiveComponent className={...child.props}>{child.props.children}</IsActiveComponent>;
    }
    if (child.type === 'a' && child.props.className?.includes('ha-reset')) {
      return (
        <button
          type='button'
          className={child.props.className}
          onClick={() => {
            p.actions.onReset();
          }}
        >
          {child.props.children}
        </button>
      );
    }
    if (child.type === 'a' && child.props.className?.includes('ha-setup')) {
      return (
        <button
          type='button'
          className={child.props.className}
          onClick={() => {
            p.actions.onSubmit();
          }}
        >
          {child.props.children}
        </button>
      );
    }

    if (['div', 'form'].includes(child.type as string)) {
      if (child.props.className?.indexOf('div-property-types') >= 0) {
        let chip: React.ReactElement = <></>;
        return (
          <div className={child.props.className}>
            {React.Children.map(child.props.children, (c, idx) => {
              return React.cloneElement(c, {
                ...c.props,
                children: React.Children.map(c.props.children, cc => {
                  if (cc.type === 'div') {
                    return React.cloneElement(cc, {
                      ...cc.props,
                      className: p.data.dwelling_types
                        ? cc.props.className + ' ' + shouldBeToggled(c.props.className.split('ptype-')[1], p.data.dwelling_types)
                        : cc.props.className,
                    });
                  }
                  return cc;
                }),
                onClick: (evt: React.SyntheticEvent<HTMLInputElement>) => {
                  const el = evt.currentTarget.querySelector('.w-checkbox-input');
                  if (el) {
                    //w--redirected-checked
                    p.actions.toggleSelectedDwellingChip(el.classList, evt.currentTarget.className.split('ptype-')[1]);
                  }
                },
              });
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
              <SearchAddressCombobox
                defaultValue={p.data.city}
                className='w-full py-0 px-1 border-0 outline-0'
                placeholder={child.props.placeholder}
                name='address'
                id='address-input'
                onPlaceSelected={g => {
                  const { city, lat, lng, nelat, nelng, swlat, swlng } = g;
                  p.actions.setGeo({
                    lat,
                    lng,
                    nelat,
                    nelng,
                    swlat,
                    swlng,
                  });
                  p.actions.setCityFilter(city);
                }}
                search={''}
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
  const params = useSearchParams();
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const closeModal = () => {
    fireEvent({ show: false, message: '', alertData: undefined });
  };
  const { fireEvent } = useEvent(Events.MyHomeAlertsModal);
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
  const [is_active, setActive] = React.useState<boolean>();
  const [listed_at, setListedAt] = React.useState<number>();
  const [year_built, setYearBuilt] = React.useState<number>();
  const [city_filter, setCityFilter] = React.useState<string>('');
  const [geo_location, setGeoLocation] = React.useState<{ [key: string]: number }>();
  const [reset_form, setResetForm] = React.useState<boolean>();
  const {
    data: { alertData },
  } = useEvent(Events.MyHomeAlertsModal) as unknown as {
    data: {
      alertData: SavedSearch;
    };
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
  const toggleActive = (val: boolean) => {
    setActive(val);
  };

  const toggleSelectedDwellingChip = (classes: DOMTokenList, ptype: string) => {
    const u = dwelling_types.map(t => {
      const collection = shouldSelectPType(ptype, classes);
      if (collection) {
        return {
          ...t,
          selected: collection.includes(t.name),
        };
      } else {
        return t;
      }
    });
    setDwellingTypes(u);
  };

  const resetForm = () => {
    if (alertData) {
      if (alertData.city) setCityFilter(alertData.city);
      if (alertData.is_active) setActive(alertData.is_active);
      if (alertData.baths) setBaths(alertData.baths);
      if (alertData.beds) setBeds(alertData.beds);
      let pricing = {
        min: alertData.minprice,
        max: alertData.maxprice,
      };
      if (pricing.min || pricing.max) {
        setPricing(pricing);
      }

      let sizing = {
        min: alertData.minsqft,
        max: alertData.maxsqft,
      };
      if (sizing.min || sizing.max) {
        setSizing(sizing);
      }
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
  };

  React.useEffect(() => {
    resetForm();
  }, [reset_form]);

  React.useEffect(() => {
    resetForm();

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
          city: city_filter,
          dwelling_types,
          beds,
          baths,
          listed_at,
          is_active,
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
          setCityFilter,
          toggleActive,
          toggleSelectedDwellingChip,
          updateListedAt,
          updateYear,
          onReset() {
            console.log('reset');
          },
          onSubmit() {
            const search_params = {
              ...geo_location,
              city: city_filter,
              beds,
              baths,
              maxprice: price?.max,
              minprice: price?.min,
              minsqft: size?.min,
              maxsqft: size?.max,
              is_active,
              dwelling_type_ids: dwelling_types.filter(t => t.selected).map(t => t.id),
            };

            alertData?.id
              ? updateSearch(alertData.id, p.agent, { search_params }).then(results => {
                  notify({
                    timeout: 5000,
                    category: NotificationCategory.SUCCESS,
                    message: 'Changes have been saved.',
                  });
                  closeModal();
                })
              : saveSearch(p.agent, { customer: p.customer, search_params, agent_customer_id: Number(params.get('customer')) || undefined }).then(results => {
                  notify({
                    timeout: 5000,
                    category: NotificationCategory.SUCCESS,
                    message: 'New home alert has been saved.',
                  });
                  p.onSave && p.onSave(results);
                  closeModal();
                });
          },
          setGeo(geo) {
            setGeoLocation(geo);
          },
        }}
      >
        {p.children}
      </Iterator>
    </div>
  );
}

function shouldSelectPType(ptype: string, classes: DOMTokenList) {
  if (ptype) {
    switch (ptype) {
      case 'aptcondo':
        return !classes.contains('w--redirected-checked') ? ['Apartment/Condo'] : [];
      case 'tnhouse':
        return !classes.contains('w--redirected-checked') ? ['Townhouse'] : [];
      case 'house':
        return !classes.contains('w--redirected-checked')
          ? ['Residential Detached', 'House/Single Family', 'House with Acreage', 'Single Family Detached']
          : [];
      case 'duplex':
        return !classes.contains('w--redirected-checked') ? ['1/2 Duplex', 'Duplex'] : [];
      case 'manufactured':
        return !classes.contains('w--redirected-checked') ? ['Manufactured', 'Manufactured with Land'] : [];
      case 'nonstrata':
        return !classes.contains('w--redirected-checked') ? ['Row House (Non-Strata)'] : [];
      case 'others':
        return !classes.contains('w--redirected-checked') ? ['Others'] : [];
    }
  }
  return;
}

function shouldBeToggled(class_name: string, dwelling_types: { [key: string]: string | number | boolean }[]) {
  const names = dwelling_types.filter(t => t.selected).map(t => t.name as string);
  const [yes] = names.map(name => {
    switch (class_name) {
      case 'aptcondo':
        return ['Apartment/Condo'].includes(name) && 'w--redirected-checked';
      case 'tnhouse':
        return ['Townhouse'].includes(name) && 'w--redirected-checked';
      case 'house':
        return ['Residential Detached', 'House/Single Family', 'House with Acreage', 'Single Family Detached'].includes(name) && 'w--redirected-checked';
      case 'duplex':
        return name.includes('Duplex') && 'w--redirected-checked';
      case 'manufactured':
        return name.includes('Manufactured') && 'w--redirected-checked';
      case 'nonstrata':
        return name.includes('Non-Strata') && 'w--redirected-checked';
      case 'others':
        return name.includes('Others') && 'w--redirected-checked';
    }
  });
  return yes;
}
