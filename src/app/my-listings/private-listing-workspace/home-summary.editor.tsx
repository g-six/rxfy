'use client';

import { AgentData } from '@/_typings/agent';
import { PrivateListingInput, PrivateListingModel } from '@/_typings/private-listing';
import { FinanceFields, NumericFields } from '@/_typings/property';
import { updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';
import { classNames } from '@/_utilities/html-helper';
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
            let { [key]: defaultValue } = attributes.listing as unknown as {
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
            const { [model]: current_items } = attributes.listing as unknown as {
              [k: string]: { id: number }[];
            };
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
                        if (cc.props?.className?.includes('input')) {
                          return cloneElement(cc, {
                            className: classNames(cc.props.className, current_items.filter(i => i.id === opt.id).length ? 'w--redirected-checked' : ''),
                          });
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
  const { amenities, connected_services, dwelling_type, building_style, land_title_taxonomy } = attributes.listing as unknown as {
    amenities: {
      id: number;
      name: string;
    }[];
    connected_services: {
      id: number;
      name: string;
    }[];
    dwelling_type?: {
      id: number;
      name: string;
    };
    building_style?: {
      id: number;
      name: string;
    };
    land_title_taxonomy?: {
      id: number;
      name: string;
    };
  };

  const [data, setData] = useState<PrivateListingInput | undefined>({
    ...attributes.listing,
    amenities: amenities.map(a => a.id),
    connected_services: connected_services.map(a => a.id),
    dwelling_type: dwelling_type?.id || undefined,
    building_style: building_style?.id || undefined,
    land_title_taxonomy: land_title_taxonomy?.id || undefined,
  });
  const [is_loading, toggleLoading] = useState<boolean>(true);
  const [options, setOptions] = useState<{
    amenities?: { id: number; name: string }[];
    connected_services?: { id: number; name: string }[];
    building_style?: { id: number; name: string }[];
    land_title_taxonomy?: { id: number; name: string }[];
    dwelling_type?: { id: number; name: string }[];
  }>({});

  function handleAction(action: string) {
    if (form.data) {
      const {
        id,
        amenities,
        connected_services,
        dwelling_type,
        asking_price,
        building_style,
        land_title_taxonomy,
        year_built,
        property_disclosure,
        gross_taxes,
        tax_year,
      } = form.data;

      if (action === 'next' && id) {
        toggleLoading(true);

        updatePrivateListing(id, {
          amenities,
          connected_services,
          dwelling_type,
          asking_price,
          building_style,
          land_title_taxonomy,
          year_built,
          property_disclosure,
          gross_taxes,
          tax_year,
        })
          .then(() => {
            const next_tab = document.querySelector('a[data-w-tab="Tab 4"]') as HTMLAnchorElement;
            next_tab.click();
          })
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
      fetch('/api/connected-services').then(r => r.json()),
      fetch('/api/dwelling-types').then(r => r.json()),
      fetch('/api/building-styles').then(r => r.json()),
      fetch('/api/land-title-taxonomies').then(r => r.json()),
    ])
      .then(responses => {
        setOptions({
          land_title_taxonomy: responses.pop(),
          building_style: responses.pop(),
          dwelling_type: responses.pop().types.sort((a: { name: string }, b: { name: string }) => {
            if (a.name === 'Other') return 0;
            return a.name < b.name ? -1 : 1;
          }),
          connected_services: responses.pop(),
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
          case 'connected_services':
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
          case 'land_title_taxonomy':
            setData({
              ...data,
              [field]: id,
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
