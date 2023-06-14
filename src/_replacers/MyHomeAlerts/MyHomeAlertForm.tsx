import { removeKeys, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { FocusEventHandler, ReactElement, createElement } from 'react';
import MapProvider from '@/app/AppContext.module';
import { searchInput } from '@/_typings/my-home-alerts';
import ChipsList from '../FilterFields/ChipList';
import { DwellingType } from '@/_typings/property';
import AddOrSubtract from '../FilterFields/AddOrSubtract';
import InputWithLabel from '../FilterFields/InputWithLabel';
import TextAreaFilter from '../FilterFields/TextAreaFilter';
import { SearchInputProxy } from './FilterProxies';
import { SavedSearchInput } from '@/_typings/saved-search';
import DatePickerFilter from '../FilterFields/DatePicker';
import { ValueInterface } from '@/_typings/ui-types';

type Props = {
  child: ReactElement;

  handleChange: (key: string, val: any) => void;
  handleFormCityChange: (val: any) => void;
  formState: SavedSearchInput;
};

export default function MyHomeAlertForm({ child, formState, handleChange, handleFormCityChange }: Props) {
  const { dwelling_types, beds, baths, minprice, maxprice, minsqft, maxsqft, tags, lat, lng, nelat, nelng, swlat, swlng, city, build_year, add_date } =
    formState;
  const handleNumberState = (key: string) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = parseInt(e.currentTarget.value) > parseInt(e.target.max) ? parseInt(e.target.max) : parseInt(e.currentTarget.value);
      handleChange(key, newVal);
    };
  };
  const handleTextState = (key: string) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(key, e.currentTarget.value);
    };
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['proptype-search']),
      transformChild: (child: ReactElement) => {
        return (
          <SearchInputProxy handleChange={handleFormCityChange} child={child} initialState={{ city, lat, lng, nelat, nelng, swlat, swlng } as searchInput} />
        );
      },
    },
    {
      searchFn: searchByClasses(['div-property-types']),
      transformChild: (child: ReactElement) => {
        const propertyTypes = [
          { label: 'House', value: DwellingType.HOUSE },
          { label: 'Apartment/Condo', value: DwellingType.APARTMENT_CONDO },
          { label: 'Townhouse', value: DwellingType.TOWNHOUSE },
          { label: 'Duplex +', value: DwellingType.DUPLEX },
          { label: 'Row House (Non-Strata)', value: DwellingType.ROW_HOUSE },
          { label: 'Manufactured', value: DwellingType.MANUFACTURED },
          { label: 'Other', value: DwellingType.OTHER },
        ];
        // const prepdDwellingTypes = dwelling_types;
        // const handleSelect = (value: ValueInterface) => {
        //   const isIn = dwelling_types?.some((item: ValueInterface) => item.value === value.value);
        //   const newArr = isIn ? dwelling_types?.filter((item: ValueInterface) => item.value !== value.value) : [...(dwelling_types ?? []), value];
        //   handleChange('dwelling_types', newArr);
        // };
        return <></>;
        // return <ChipsList template={child} values={dwelling_types?.map() ?? []} chipsList={propertyTypes} handleSelect={handleSelect} />;
      },
    },
    {
      searchFn: searchByClasses(['beds-filter']),
      transformChild: (child: ReactElement) => {
        const handleClick = (val: number) => {
          const newVal = val > 0 ? val : 0;
          handleChange('beds', newVal);
        };

        return <AddOrSubtract template={child} value={beds ?? 0} handleFunc={handleClick} />;
      },
    },
    {
      searchFn: searchByClasses(['baths-filter']),
      transformChild: (child: ReactElement) => {
        const handleClick = (val: number) => {
          const newVal = val > 0 ? val : 0;
          handleChange('baths', newVal);
        };
        return <AddOrSubtract template={child} value={baths ?? 0} handleFunc={handleClick} />;
      },
    },
    {
      searchFn: searchByClasses(['price-min-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleNumberState('minprice');
        return (
          <InputWithLabel
            template={child}
            inputProps={{
              type: 'number',
              min: 0,
              onBlur: e => {
                console.log('.price-min-filter: onBlur', e.target.value);
              },
            }}
            value={minprice ?? 0}
            handleChange={handleOnChange}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['price-max-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleNumberState('maxprice');
        const prepdMax = maxprice && minprice && Math.max(minprice, maxprice);
        return <InputWithLabel template={child} inputProps={{ type: 'number', min: minprice ?? 0 }} value={prepdMax ?? 0} handleChange={handleOnChange} />;
      },
    },
    {
      searchFn: searchByClasses(['size-min-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleNumberState('minsqft');
        return <InputWithLabel template={child} inputProps={{ type: 'number', min: 0 }} value={minsqft ?? 0} handleChange={handleOnChange} />;
      },
    },
    {
      searchFn: searchByClasses(['size-max-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleNumberState('maxsqft');
        const prepdMax = maxprice && minprice && Math.max(minprice, maxprice);
        return <InputWithLabel template={child} inputProps={{ type: 'number', min: 0 }} value={maxsqft ?? 0} handleChange={handleOnChange} />;
      },
    },
    {
      searchFn: searchByClasses(['keywords-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleTextState('tags');
        return <TextAreaFilter template={child} inputProps={{ type: 'text' }} value={tags ?? ''} handleChange={handleOnChange} />;
      },
    },
    {
      searchFn: searchByClasses(['date-listed-since']),
      transformChild: (child: ReactElement) => {
        const setDate = (timestamp: number) => {
          handleChange('add_date', timestamp / 1000);
        };
        return <DatePickerFilter className={child.props.className} onChange={setDate} value={formState?.add_date ? formState?.add_date * 1000 : Date.now()} />;
      },
    },
    {
      searchFn: searchByClasses(['newer-than-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleNumberState('build_year');
        return (
          <InputWithLabel
            template={child}
            inputProps={{ type: 'number', min: 0, max: 10000, placeholder: 'Type Year' }}
            value={build_year ?? 0}
            handleChange={handleOnChange}
          />
        );
      },
    },
  ];
  return (
    <>
      <MapProvider>
        {transformMatchingElements(
          createElement('div', { ...removeKeys(child.props, ['id', 'name', 'data-name', 'tab-index', 'role', 'area-label', 'method']) }, [
            ...child.props.children,
          ]),
          matches,
        )}
      </MapProvider>
    </>
  );
}
