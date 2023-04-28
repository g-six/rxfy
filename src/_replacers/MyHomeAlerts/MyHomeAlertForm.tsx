import { removeKeys, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, createElement } from 'react';
import MapProvider from '@/app/AppContext.module';
import { searchInput } from '@/_typings/my-home-alerts';
import ChipsList from '../FilterFields/ChipList';
import { DwellingType } from '@/_typings/property';
import AddOrSubtract from '../FilterFields/AddOrSubtract';
import InputFilter from '../FilterFields/InputFilter';
import TextAreaFilter from '../FilterFields/TextAreaFilter';
import RxDatePickerFilter from '../FilterFields/DatePicker';
import { SearchInputProxy } from './FilterProxies';

type Props = {
  child: ReactElement;

  handleChange: (key: string, val: any) => void;
  handleFormCityChange: (val: any) => void;
  formState: any;
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

        const handleSelect = (value: string | number) => {
          const isIn = dwelling_types.some((item: string) => item === value);
          const newArr = isIn ? dwelling_types.filter((item: string) => item !== value) : [...dwelling_types, value];
          handleChange('dwelling_types', newArr);
        };

        return <ChipsList template={child} values={dwelling_types} chipsList={propertyTypes} handleSelect={handleSelect} />;
      },
    },
    {
      searchFn: searchByClasses(['beds-filter']),
      transformChild: (child: ReactElement) => {
        const handleClick = (val: number) => {
          const newVal = val > 0 ? val : 0;
          handleChange('beds', newVal);
        };

        return <AddOrSubtract template={child} value={beds} handleFunc={handleClick} />;
      },
    },
    {
      searchFn: searchByClasses(['baths-filter']),
      transformChild: (child: ReactElement) => {
        const handleClick = (val: number) => {
          const newVal = val > 0 ? val : 0;
          handleChange('baths', newVal);
        };
        return <AddOrSubtract template={child} value={baths} handleFunc={handleClick} />;
      },
    },
    {
      searchFn: searchByClasses(['price-min-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleNumberState('minprice');
        return <InputFilter template={child} inputProps={{ type: 'number', min: 0 }} value={minprice} handleChange={handleOnChange} />;
      },
    },
    {
      searchFn: searchByClasses(['price-max-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleNumberState('maxprice');
        return <InputFilter template={child} inputProps={{ type: 'number', min: 0 }} value={maxprice} handleChange={handleOnChange} />;
      },
    },
    {
      searchFn: searchByClasses(['size-min-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleNumberState('minsqft');
        return <InputFilter template={child} inputProps={{ type: 'number', min: 0 }} value={minsqft} handleChange={handleOnChange} />;
      },
    },
    {
      searchFn: searchByClasses(['size-max-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleNumberState('maxsqft');
        return <InputFilter template={child} inputProps={{ type: 'number', min: 0 }} value={maxsqft} handleChange={handleOnChange} />;
      },
    },
    {
      searchFn: searchByClasses(['keywords-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleTextState('tags');
        return <TextAreaFilter template={child} inputProps={{ type: 'text' }} value={tags !== null ? tags : ''} handleChange={handleOnChange} />;
      },
    },
    {
      searchFn: searchByClasses(['date-listed-since']),
      transformChild: (child: ReactElement) => {
        const setDate = (val: any) => {
          handleChange('add_date', val);
        };
        return <RxDatePickerFilter className={child.props.className} placeholder={child.props?.placeholder} addDate={add_date} setDate={setDate} />;
      },
    },
    {
      searchFn: searchByClasses(['newer-than-filter']),
      transformChild: (child: ReactElement) => {
        const handleOnChange = handleNumberState('build_year');
        return (
          <InputFilter
            template={child}
            inputProps={{ type: 'number', min: 0, max: 2023, placeholder: 'Type Year' }}
            value={build_year}
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
