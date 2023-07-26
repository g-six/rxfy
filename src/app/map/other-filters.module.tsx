'use client';

import { classNames } from '@/_utilities/html-helper';
import { objectToQueryString, queryStringToObject } from '@/_utilities/url-helper';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import ChipComponent from './chip-component.module';

function FormComponentIterator({
  children,
  ...props
}: {
  children: React.ReactElement;
  onSelectType(evt: React.SyntheticEvent): void;
  onTextInputChange(evt: React.SyntheticEvent): void;
  onDateInputChange(evt: React.SyntheticEvent): void;
}) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      return (
        <div {...c.props} className={classNames(c.props.className || '', 'rexified', 'form-component-wrapper')}>
          <FormComponentIterator {...props}>{c.props.children}</FormComponentIterator>
        </div>
      );
    }
    if (c.type === 'label') {
      const { children: subchildren, className: labelClassName, ...label_props } = c.props;
      if (labelClassName.includes(' ptype-')) {
        return (
          <ChipComponent {...label_props} onSelectType={props.onSelectType} className={classNames(labelClassName, 'property-type-filter')}>
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
  onDateInputChange(evt: React.SyntheticEvent): void;
}) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      return (
        <div {...c.props}>
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
    return c;
  });
  return <>{Wrapped}</>;
}

export default function OtherMapFilters({ className, children }: { className: string; children: React.ReactElement }) {
  const router = useRouter();
  const search = useSearchParams();
  const { data, fireEvent } = useEvent(Events.MapSearch);
  const onSelectType = (evt: React.SyntheticEvent) => {
    const is_selected = evt.currentTarget.getAttribute('data-selected') !== null;
    const value = evt.currentTarget.getAttribute('data-value');
    let { dwelling_types } = data as unknown as {
      dwelling_types: string[];
    };
    if (!dwelling_types) {
      dwelling_types = [];
    }
    if (value) {
      dwelling_types = dwelling_types.filter(t => t !== value);
      if (is_selected) dwelling_types.push(value);
    }

    const q = queryStringToObject(search.toString());
    delete q.types;
    router.push(
      'map?' +
        objectToQueryString({
          ...q,
          ...(dwelling_types.length ? { types: dwelling_types.join(',') } : {}),
        }),
    );

    fireEvent({
      ...data,
      dwelling_types,
      reload: true,
    } as unknown as EventsData);
  };
  const onTextInputChange = (evt: React.SyntheticEvent) => {};
  const onDateInputChange = (evt: React.SyntheticEvent) => {};
  return (
    <div className={classNames(className, 'rexified', 'OtherMapFilters')}>
      <Iterator onSelectType={onSelectType} onTextInputChange={onTextInputChange} onDateInputChange={onDateInputChange}>
        {children}
      </Iterator>
    </div>
  );
}
