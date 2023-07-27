'use client';

import { classNames } from '@/_utilities/html-helper';
import { objectToQueryString, queryStringToObject } from '@/_utilities/url-helper';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import ChipComponent from './chip-component.module';
import formReducer from './other-filters-reducer.module';
type FormData = {
  types?: string[];
  keywords?: string;
  date?: Date;
  year_built?: number;
  minsqft?: number;
  maxsqft?: number;
};
function FormComponentIterator({
  children,
  ...props
}: {
  children: React.ReactElement;
  onSelectType(evt: React.SyntheticEvent): void;
  onTextInputChange(evt: React.SyntheticEvent): void;
  data: FormData;
}) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      return (
        <div {...c.props} className={classNames(c.props.className || '', 'rexified', 'form-component-wrapper')}>
          <FormComponentIterator {...props}>{c.props.children}</FormComponentIterator>
        </div>
      );
    }

    if (c.type === 'input') {
      if (c.props.className.includes('sqft-min') || c.props.className.includes('sqft-max')) {
        if (c.props.className.includes('sqft-min')) {
          return React.cloneElement(c, { ...c.props, onChange: props.onTextInputChange, value: props.data.minsqft || '' });
        }
        if (c.props.className.includes('sqft-max')) {
          return React.cloneElement(c, { ...c.props, onChange: props.onTextInputChange, value: props.data.maxsqft || '' });
        }
      }
      if (c.props.className.includes('date-newer-than')) {
        return React.cloneElement(c, {
          ...c.props,
          id: 'year_built',
          onChange: props.onTextInputChange,
          value: props.data.year_built || '',
        });
      }
      if (c.props.className.includes('date-listed-since')) {
        let dt;
        if (props.data.date) {
          const [year, month, day] = `${props.data.date}`.split('-').map(Number);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            dt = new Date(year, month - 1, day);
          }
        }
        return React.cloneElement(c, {
          ...c.props,
          onChange: props.onTextInputChange,
          placeholder: '28/2/2023',
          id: 'date',
          value: dt ? `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}` : props.data.date,
        });
      }
    }
    if (c.type === 'textarea') {
      return React.cloneElement(c, { ...c.props, id: 'keywords', onChange: props.onTextInputChange, value: props.data.keywords || '' });
    }
    if (c.type === 'label') {
      const { children: subchildren, className: labelClassName, ...label_props } = c.props;
      if (labelClassName.includes(' ptype-')) {
        return (
          <ChipComponent
            {...label_props}
            active={`${props.data.types || ''}`.split(',')}
            onSelectType={props.onSelectType}
            className={classNames(labelClassName, 'property-type-filter')}
          >
            {subchildren}
          </ChipComponent>
        );
      }
    }
    return c;
  });

  return <>{Wrapped}</>;
}

function Iterator({
  children,
  ...props
}: {
  children: React.ReactElement;
  onSelectType(evt: React.SyntheticEvent): void;
  onTextInputChange(evt: React.SyntheticEvent): void;
  onReset(evt: React.SyntheticEvent): void;
  onSubmit(evt: React.SyntheticEvent): void;
  submitted?: boolean;
  data: FormData;
}) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      let { className, style } = c.props;
      if (props.submitted && className) {
        className = className.split('w--open').join('');
        style = undefined;
        document.querySelectorAll('.w--open').forEach(el => el.classList.remove('w--open'));
        document.querySelectorAll('[aria-expanded="true"]').forEach(el => el.setAttribute('aria-expanded', 'false'));
        document.querySelectorAll('.w-dropdown').forEach(el => el.removeAttribute('style'));
      }
      return (
        <div {...c.props} className={className} style={style}>
          <Iterator {...props}>{c.props.children}</Iterator>
        </div>
      );
    }
    if (c.type === 'form') {
      return (
        <div {...c.props} rx-form=''>
          <FormComponentIterator {...props}>{c.props.children}</FormComponentIterator>
        </div>
      );
    }

    if (c.type === 'a') {
      return (
        <button
          className={c.props.className}
          type={c.props.className.includes('do-reset') ? 'reset' : 'button'}
          onClick={c.props.className.includes('do-reset') ? props.onReset : props.onSubmit}
        >
          {c.props.children}
        </button>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default function OtherMapFilters({ className, children }: { className: string; children: React.ReactElement }) {
  const router = useRouter();
  const search = useSearchParams();
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const [state, dispatch] = React.useReducer(formReducer, (search.toString() && queryStringToObject(search.toString())) || {});
  const [submitted, setToSubmitted] = React.useState<boolean>(false);
  const onSelectType = (evt: React.SyntheticEvent) => {
    const is_selected = evt.currentTarget.getAttribute('data-selected') !== null;
    const value = evt.currentTarget.getAttribute('data-value');
    if (value) {
      let { types } = state as unknown as {
        types: string;
      };
      const dwelling_types = (types || '').split(',').filter(t => t && t !== value);
      if (is_selected) dwelling_types.push(value);
      dispatch({
        type: 'UPDATE_VALUE',
        key: 'types',
        value: dwelling_types.join(','),
      });
    }
  };
  const onTextInputChange = (evt: React.SyntheticEvent) => {
    let { value } = evt.currentTarget as unknown as {
      value?: string | number;
    };
    let key;
    if (evt.currentTarget.classList.contains('sqft-min')) {
      key = 'minsqft';
      value = isNaN(Number(value)) ? undefined : Number(value);
    }
    if (evt.currentTarget.classList.contains('sqft-max')) {
      key = 'maxsqft';
      value = isNaN(Number(value)) ? undefined : Number(value);
    }
    if (!key && evt.currentTarget.id) {
      key = evt.currentTarget.id;
    }
    if (key)
      dispatch({
        type: 'UPDATE_VALUE',
        key,
        value,
      });
  };

  const onReset = (evt: React.SyntheticEvent) => {
    dispatch({
      type: 'RESET_VALUE',
      key: '',
      value: queryStringToObject(search.toString()) as unknown as {
        [k: string]: string | number | boolean | string[];
      },
    });
  };

  const onSubmit = (evt: React.SyntheticEvent) => {
    router.push('map?' + objectToQueryString(state as unknown as { [key: string]: string }));
    setToSubmitted(true);
    fireEvent({
      ...data,
      reload: true,
    });
  };

  React.useEffect(() => {
    if (submitted) {
      setToSubmitted(false);
    }
  }, [submitted]);

  React.useEffect(() => {
    if (data) {
      const { city, place_id, ...geo_filters } = data as unknown as {
        [k: string]: string;
      };
      if (place_id) {
        const { lat, lng } = geo_filters as unknown as {
          [k: string]: number;
        };
        let value = queryStringToObject(search.toString()) as unknown as {
          [k: string]: string | number | boolean | string[];
        };
        value = {
          ...value,
          place_id,
          city,
          center: `${lat},${lng}`,
        };
        dispatch({
          type: 'RESET_VALUE',
          key: '',
          value,
        });
        router.push('map?' + objectToQueryString(value as unknown as { [key: string]: string }));
      }
    }
  }, [data]);

  return (
    <div className={classNames(className, 'rexified', 'OtherMapFilters')}>
      <Iterator
        submitted={submitted}
        data={state || {}}
        onReset={onReset}
        onSubmit={onSubmit}
        onSelectType={onSelectType}
        onTextInputChange={onTextInputChange}
      >
        {children}
      </Iterator>
    </div>
  );
}
