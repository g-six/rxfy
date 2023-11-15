'use client';

import { AgentData } from '@/_typings/agent';
import { PrivateListingInput, PrivateListingModel } from '@/_typings/private-listing';
import InputDropdown from '@/components/Dropdowns/InputDropdown.module';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { Children, MouseEvent, ReactElement, cloneElement, useEffect, useState } from 'react';

interface Props {
  children: ReactElement;
  agent: AgentData;
  listing?: PrivateListingModel;
  className?: string;
}

function Rexifier({
  children,
  data,
  ...attributes
}: Props & {
  data?: {
    [k: string]: {
      id: number;
      name: string;
    }[];
  };
  onChange(
    field: string,
    value: {
      id: number;
      name: string;
    },
  ): void;
}) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { className = '', 'data-field': field_name, 'data-group': model } = c.props;
      className = `rexified ${className}`.trim();
      if (c.props.children) {
        if (typeof c.props.children !== 'string') {
          if (className.includes('w-dropdown') && field_name) {
            return (
              <div rx-parent='home-summary.editor' className='w-full'>
                <InputDropdown
                  {...attributes}
                  className={className}
                  field-name={field_name}
                  options={data ? data[field_name] : []}
                  onSelect={(selection: { id: number; name: string }) => {
                    attributes.onChange(field_name, selection);
                  }}
                >
                  {c.props.children}
                </InputDropdown>
              </div>
            );
          }

          if (model) {
            const options = (data && data[model]) || [];
            return cloneElement(
              c,
              {},
              Children.map(c.props.children, (chip, idx) =>
                idx === 0 && data && data[model] ? (
                  options.map(opt =>
                    cloneElement(
                      chip,
                      {
                        key: opt.id,
                        onMouseUp: (evt: MouseEvent) => {
                          // onClick triggers twice probably due to jquery?
                          // using onMouseUp instead
                          attributes.onChange(model, opt);
                        },
                      },
                      Children.map(chip.props.children, cc => {
                        if (cc.props?.className?.includes('label')) {
                          return cloneElement(cc, {}, opt.name);
                        }
                        return cc;
                      }),
                    ),
                  )
                ) : (
                  <></>
                ),
              ),
            );
          }
          return cloneElement(
            c,
            { className, 'rx-parent': 'home-summary.editor' },
            <Rexifier {...attributes} data={data}>
              {c.props.children}
            </Rexifier>,
          );
        }
      }
      return cloneElement(c, { className });
    }
    return c;
  });
  return <>{Rexified}</>;
}

export function MyListingsHomeSummaryEditor({ children, ...attributes }: Props) {
  const form = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  const { dwelling_type, building_style, land_title } = attributes.listing as unknown as {
    dwelling_type?: {
      id: number;
      name: string;
    };
    building_style?: {
      id: number;
      name: string;
    };
    land_title?: string;
  };

  const [data, setData] = useState<PrivateListingInput | undefined>({
    ...attributes.listing,
    dwelling_type: dwelling_type?.id || undefined,
    building_style: building_style?.id || undefined,
    land_title,
  });
  const [is_loading, toggleLoading] = useState<boolean>(true);
  const [options, setOptions] = useState<{
    amenities?: { id: number; name: string }[];
    building_style?: { id: number; name: string }[];
    land_title?: { id: number; name: string }[];
    property_type?: { id: number; name: string }[];
  }>({});

  useEffect(() => {
    if (data) form.fireEvent(data as unknown as PrivateListingData);
  }, [data]);

  useEffect(() => {
    Promise.all([
      fetch('/api/amenities').then(r => r.json()),
      fetch('/api/dwelling-types').then(r => r.json()),
      fetch('/api/building-styles').then(r => r.json()),
      fetch('/api/land-title-taxonomies').then(r => r.json()),
    ])
      .then(responses => {
        setOptions({
          land_title: responses.pop(),
          building_style: responses.pop(),
          property_type: responses.pop().types.sort((a: { name: string }, b: { name: string }) => {
            if (a.name === 'Other') return 0;
            return a.name < b.name ? -1 : 1;
          }),
          amenities: responses.pop(),
        });
      })
      .finally(() => {
        toggleLoading(false);
      });
  }, []);

  return (
    <Rexifier
      {...attributes}
      data={options}
      onChange={(field, value) => {
        switch (field) {
          case 'amenities':
          case 'utilities':
            const updates = data as unknown as {
              [k: string]: number[];
            };
            setData({
              ...data,
              [field]: updates[field].includes(value.id) ? updates[field].filter(d => d !== value.id) : updates[field].concat(value.id),
            });
            break;
          case 'property_type':
          case 'building_style':
            setData({
              ...data,
              [field]: value.id,
            });
            break;
          case 'land_title':
            setData({
              ...data,
              land_title: value.name,
            });
            break;
        }
      }}
    >
      {children}
    </Rexifier>
  );
}
