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
import { convertDivsToSpans } from '@/_replacers/DivToSpan';

type Props = {
  children: React.ReactElement;
  className: string;
  agent: AgentData;
  customer?: number;
  reload: (results: SavedSearch) => void;
};

function IsActiveComponent(p: { className?: string; id?: string; children: React.ReactElement }) {
  const Wrapped = React.Children.map(p.children, child => {
    return convertDivsToSpans(child);
  });

  return <>{Wrapped}</>;
}

function Iterator(
  p: Props & {
    'data-selected-dwelling-types': string;
    data: {
      city?: string;
      tags?: string;
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
      setTags: React.Dispatch<React.SetStateAction<string | undefined>>;
      setGeo: (g: { [key: string]: number }) => void;
      toggleActive: (s: boolean) => void;
      toggleSelectedDwellingChip: (ptype: string) => { [key: string]: string | number | boolean }[];
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

    if (child.type === 'label') {
      if (child.props.className.includes(' ptype-')) {
        const [ptype] = child.props.className
          .split(' ')
          .map((subclass: string) => (subclass.indexOf('ptype') === 0 ? `ptype-${subclass.split('ptype-')[1]}` : ''))
          .filter((subclass: string) => subclass);
        return React.cloneElement(<button type='button' />, {
          ...child.props,
          onClick: (evt: React.SyntheticEvent) => {
            evt.stopPropagation();
            const span = evt.currentTarget.querySelector('[data-value]') as HTMLSpanElement;
            const dwelling_types_csv = span.dataset.value || '';

            if (dwelling_types_csv) p.actions.toggleSelectedDwellingChip(dwelling_types_csv);
          },
          children: React.Children.map(child.props.children, cc => {
            if (cc.type === 'div') {
              const selected = p.data.dwelling_types.filter(t => {
                return t.selected && getShortType(t.name) === ptype;
              }).length;

              return convertDivsToSpans(
                React.cloneElement(cc, {
                  ...cc.props,
                  className: selected ? cc.props.className + ' w--redirected-checked ' : cc.props.className,
                }),
              );
            }
            if (cc.props['data-value'])
              return (
                <span className={cc.props.className} data-value={cc.props['data-value']}>
                  {cc.props.children}
                </span>
              );
            return cc;
          }),
        });
      }
    }

    if (['div', 'form'].includes(child.type as string)) {
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

      return React.cloneElement(child, {
        ...child.props,
        children: (
          <Iterator {...p} className=''>
            {child.props.children}
          </Iterator>
        ),
      });
    }

    if (child.type === 'textarea' && child.props?.placeholder?.includes('keyword')) {
      return React.cloneElement(child, {
        ...child.props,
        defaultValue: p.data.tags || '',
        onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
          p.actions.setTags(evt.currentTarget.value);
        },
      });
    }

    if (child.type === 'input') {
      if (child.props.className?.includes('date-newer-than')) {
        return React.cloneElement(child, {
          ...child.props,
          defaultValue: p.data.year_built || '',
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.actions.updateYear(evt.currentTarget.value);
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
  const { data, fireEvent } = useEvent(Events.MyHomeAlertsModal);
  const closeModal = () => {
    fireEvent({ show: false, message: '', alertData: undefined });
  };
  const { alertData } = data as unknown as {
    alertData: SavedSearch;
  };
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
  const [tags, setTags] = React.useState<string>();
  const [size, setSizing] = React.useState<{ min?: number; max?: number }>({});
  const [is_active, setActive] = React.useState<boolean>();
  const [listed_at, setListedAt] = React.useState<number>();
  const [year_built, setYearBuilt] = React.useState<number>();
  const [city_filter, setCityFilter] = React.useState<string>('');
  const [geo_location, setGeoLocation] = React.useState<{ [key: string]: number }>();
  const [reset_form, setResetForm] = React.useState<boolean>();
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

  const toggleSelectedDwellingChip = (dwelling_name: string): { [key: string]: string | boolean | number }[] => {
    const u = dwelling_types.map(t => {
      if (dwelling_name.indexOf('Duplex') >= 0 && t.name.indexOf('Duplex') >= 0) {
        return {
          ...t,
          selected: !t.selected,
        };
      } else if (dwelling_name.indexOf('Apartment') >= 0 && t.name.indexOf('Apartment') >= 0) {
        return {
          ...t,
          selected: !t.selected,
        };
      } else if (dwelling_name.indexOf('Townhouse') >= 0 && t.name.indexOf('Townhouse') >= 0) {
        return {
          ...t,
          selected: !t.selected,
        };
      } else if (dwelling_name.indexOf('Other') >= 0 && t.name.indexOf('Other') >= 0) {
        return {
          ...t,
          selected: !t.selected,
        };
      } else if (dwelling_name.indexOf('Non-Strata') >= 0 && t.name.indexOf('Non-Strata') >= 0) {
        return {
          ...t,
          selected: !t.selected,
        };
      } else if (dwelling_name.indexOf('Manufactured') >= 0 && t.name.indexOf('Manufactured') >= 0) {
        return {
          ...t,
          selected: !t.selected,
        };
      } else if (
        dwelling_name.indexOf('House') === 0 &&
        ['Residential Detached', 'House/Single Family', 'House with Acreage', 'Single Family Detached'].includes(t.name)
      ) {
        return {
          ...t,
          selected: !t.selected,
        };
      }

      return t;
    });

    setDwellingTypes(u);
    return u.filter(t => t.selected);
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
      if (alertData.year_built) setYearBuilt(alertData.year_built as unknown as number);
      if (alertData.dwelling_types?.length) {
        const u = dwelling_types.map(t => {
          return {
            ...t,
            selected: alertData.dwelling_types?.includes(t.name),
          };
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

  React.useEffect(() => {}, [dwelling_types]);

  React.useEffect(() => {
    getDwellingTypes().then(res => {
      const { types } = res as unknown as {
        types: {
          name: string;
          id: number;
        }[];
      };
      setDwellingTypes(
        types.map(t => ({
          ...t,
          selected: false,
        })),
      );
    });
  }, []);

  const dwelling_type_csv = dwelling_types
    .filter(t => t.selected)
    .map(t => getShortType(t.name))
    .join(' ');

  const { reload, ...props } = p;
  return (
    <div
      {...props}
      id='RxHomeAlertForm'
      onClick={(evt: React.SyntheticEvent) => {
        /// Fix to modal pre-maturely closing itself.
        evt.stopPropagation();
      }}
      style={
        alertData
          ? {
              display: 'flex',
            }
          : {}
      }
    >
      <Iterator
        {...p}
        data-selected-dwelling-types={dwelling_type_csv}
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
          tags,
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
          setTags,
          onReset() {
            console.log('reset');
          },
          onSubmit() {
            const search_params: {
              [k: string]: number | string | number[] | undefined | boolean;
            } = {
              ...geo_location,
              city: city_filter,
              beds,
              baths,
              maxprice: price?.max,
              minprice: price?.min,
              minsqft: size?.min,
              maxsqft: size?.max,
              is_active,
              year_built,
              tags,
              dwelling_type_ids: dwelling_types.filter(t => t.selected).map(t => t.id),
            };

            if (listed_at) {
              search_params.listed_at = new Date(listed_at).toISOString();
            }

            alertData?.id
              ? updateSearch(alertData.id, p.agent, { search_params }).then(results => {
                  notify({
                    timeout: 5000,
                    category: NotificationCategory.SUCCESS,
                    message: 'Changes have been saved.',
                  });
                  p.reload(results);
                  closeModal();
                })
              : saveSearch(p.agent, { customer: p.customer, search_params, agent_customer_id: Number(params.get('customer')) || undefined }).then(results => {
                  notify({
                    timeout: 5000,
                    category: NotificationCategory.SUCCESS,
                    message: 'New home alert has been saved.',
                  });
                  location.reload();
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

function getShortType(name: string) {
  switch (name) {
    case 'Apartment/Condo':
      return 'ptype-aptcondo';

    case 'Townhouse':
      return 'ptype-tnhouse';

    case 'Others':
    case 'Other':
      return 'ptype-others';

    case 'House/Single Family':
    case 'House with Acreage':
    case 'Single Family Detached':
    case 'Residential Detached':
      return 'ptype-house';
  }
  if (name.indexOf('Duplex') >= 0) return 'ptype-duplex';
  if (name.indexOf('Manufactured') >= 0) return 'ptype-manufactured';
  if (name.indexOf('Non-Strata') >= 0) return 'ptype-nonstrata';
}
