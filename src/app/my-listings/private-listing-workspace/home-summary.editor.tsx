'use client';

import { AgentData } from '@/_typings/agent';
import { PrivateListingInput, PrivateListingModel } from '@/_typings/private-listing';
import { FinanceFields, NumericFields } from '@/_typings/property';
import { updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';
import InputDropdown from '@/components/Dropdowns/InputDropdown.module';
import SpinningDots from '@/components/Loaders/SpinningDots';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { Children, MouseEvent, ReactElement, SyntheticEvent, cloneElement, useEffect, useState } from 'react';

interface Props {
  children: ReactElement;
  agent: AgentData;
  listing?: PrivateListingModel;
  className?: string;
  disabled?: boolean;
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
  onAction(action: string): void;
  onChange(
    field: string,
    value:
      | {
          id: number;
          name: string;
        }
      | string,
  ): void;
}) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { className = '', 'data-field': field_name, 'data-group': model, 'data-action': action } = c.props;
      className = `rexified ${className}`.trim();
      if (action)
        return (
          <button
            className={c.props.className}
            disabled={attributes.disabled}
            onClick={() => {
              attributes.onAction(action);
            }}
          >
            {attributes.disabled && <SpinningDots className='fill-white w-6 h-6 text-white mr-2' />}
            {c.props.children}
          </button>
        );
      if (c.props.children) {
        if (typeof c.props.children !== 'string') {
          if (className.includes('w-dropdown') && field_name) {
            let key = field_name;
            const { [key]: defaultValue } = attributes.listing as unknown as {
              [k: string]: {
                id: number;
                name: string;
              };
            };
            return (
              <div rx-parent='home-summary.editor' className='w-full'>
                <InputDropdown
                  {...attributes}
                  defaultValue={defaultValue}
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
      } else if (attributes.listing && field_name) {
        const { [field_name]: defaultValue } = attributes.listing as unknown as {
          [k: string]: string;
        };
        return cloneElement(c, {
          defaultValue,
          onChange: (evt: SyntheticEvent<HTMLInputElement>) => {
            attributes.onChange(field_name, evt.currentTarget.value);
          },
        });
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
    dwelling_type?: { id: number; name: string }[];
  }>({});

  function handleAction(action: string) {
    if (form.data) {
      const { id, dwelling_type, asking_price, building_style, land_title, year_built, property_disclosure, gross_taxes, tax_year } = form.data;

      if (action === 'next' && id) {
        console.log(action, {
          id,
          dwelling_type,
          asking_price,
          building_style,
          land_title,
          year_built,
          property_disclosure,
          gross_taxes,
          tax_year,
        });

        toggleLoading(true);

        updatePrivateListing(id, {
          dwelling_type,
          asking_price,
          building_style,
          land_title,
          year_built,
          property_disclosure,
          gross_taxes,
          tax_year,
        })
          .then(console.log)
          .finally(() => {
            toggleLoading(false);
          });
      }
    }
  }

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
          dwelling_type: responses.pop().types.sort((a: { name: string }, b: { name: string }) => {
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
      disabled={is_loading}
      data={options}
      onAction={handleAction}
      onChange={(field, polyval) => {
        const { id, name } = polyval as { id: number; name: string };
        const value = polyval as string;
        switch (field) {
          case 'amenities':
          case 'utilities':
            const updates = data as unknown as {
              [k: string]: number[];
            };
            setData({
              ...data,
              [field]: updates[field].includes(id) ? updates[field].filter(d => d !== id) : updates[field].concat(id),
            });
            break;
          case 'dwelling_type':
          case 'building_style':
            setData({
              ...data,
              [field]: id,
            });
            break;
          case 'land_title':
            setData({
              ...data,
              land_title: name,
            });
            break;
          default:
            setData({
              ...data,
              [field]: FinanceFields.concat(NumericFields).includes(field) ? Number(value) : value,
            });
        }
      }}
    >
      {children}
    </Rexifier>
  );
}
