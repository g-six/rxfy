import { getPropertyAttributes } from '@/_utilities/api-calls/call-property-attributes';
import { classNames } from '@/_utilities/html-helper';
import { KeyValuePair } from '@/app/api/properties/types';
import { ChangeEvent, ReactElement, useEffect, useState } from 'react';

import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import useEvent, { Events } from '@/hooks/useEvent';
import { EventData } from 'mapbox-gl';
import styles from './more-fields.popup.module.scss';

const default_selection = {
  home_attributes: [1, 2, 7, 11],
  financial_stats: [1, 2],
  square_footage: [1, 4],
};

const base_relationships = [
  {
    category: 'home_attributes',
    items: [
      'age',
      'date_listed',
      'exterior_finish',
      'floors',
      'fireplace',
      'total_fireplaces',
      'total_parking',
      'total_covered_parking',
      'foundation_specs',
      'year_built',
    ],
  },
  {
    category: 'financial_stats',
    items: ['gross_taxes', 'strata_fee'],
  },
  {
    category: 'restrictions',
    items: ['total_allowed_rentals', 'building_by_laws', 'total_pets_allowed', 'total_cats_allowed', 'total_dogs_allowed'],
  },
  {
    category: 'building_info',
    items: ['num_units_in_community', 'building_total_units', 'property_dis'],
  },
  {
    category: 'square_footage',
    items: ['floor_area', 'floor_levels', 'floor_area_below_main', 'price_per_sqft'],
  },
  {
    category: 'others',
    items: ['amenities', 'facilities', 'appliances', 'build_features', 'hvac', 'connected_services'],
  },
];
const additional_fields = [
  {
    category: 'home_attributes',
    items: ['exterior_finish', 'floors', 'fireplace', 'total_fireplaces', 'total_covered_parking', 'foundation_specs'],
  },
  {
    category: 'restrictions',
    items: ['total_allowed_rentals', 'building_by_laws', 'total_pets_allowed', 'total_cats_allowed', 'total_dogs_allowed'],
  },
  {
    category: 'building_info',
    items: ['num_units_in_community', 'building_total_units', 'complex_compound_name', 'video_link'],
  },
  {
    category: 'square_footage',
    items: ['floor_levels', 'floor_area_below_main', 'frontage_feet'],
  },
];

export default function MoreFieldsPopup({
  children,
  ...attr
}: {
  children: ReactElement;
  className: string;
  amenities?: boolean;
  facilities?: boolean;
  'base-only'?: boolean;
  'connected-services'?: boolean;
  'hide-icon'?: boolean;
  'hide-defaults'?: boolean;
  'right-align'?: boolean;
  onChange(updates: { [k: string]: number[] }): void;
}) {
  const filterEvent = useEvent(Events.AddPropertyFilter);
  const only_show = ['appliances', 'hvac', 'parking', 'places_of_interest'];
  if (attr.amenities) {
    only_show.reverse().push('amenities');
    only_show.reverse();
  }
  if (attr['connected-services']) only_show.push('connected_services');
  if (attr.facilities) only_show.push('facilities');
  const [relationships, setRelationships] = useState<{
    [k: string]: KeyValuePair[];
  }>();

  const [all_items, setFilteredItems] = useState<
    {
      category: string;
      id: number;
      name: string;
    }[]
  >();

  const [category, setCategory] = useState<string>(attr['base-only'] ? 'home_attributes' : 'appliances');
  const [selected_items, setSelectedItems] = useState<{
    [k: string]: number[];
  }>(attr['base-only'] && !attr['hide-defaults'] ? default_selection : {});

  function toggleItem(item_category: string, item_id: number) {
    let selection = { ...selected_items };
    if (!selection || !selection[item_category]) {
      setSelectedItems({
        ...selected_items,
        [item_category]: [item_id],
      });
    } else {
      const index = selection[item_category].indexOf(item_id);
      if (index >= 0) {
        selection[item_category].splice(index, 1);
      } else {
        selection[item_category].push(item_id);
      }
      setSelectedItems(selection);
    }
  }

  function filterFields(name: string) {
    setFilteredItems([]);
    if (relationships) {
      if (category) setCategory('');
      const mixed_bag: { category: string; id: number; name: string }[] = [];
      Object.keys(relationships).forEach(c => {
        if (attr['base-only'] || only_show.includes(c))
          relationships[c].forEach(x => {
            if (name && x.name.toLowerCase().includes(name.toLowerCase())) {
              mixed_bag.push({
                ...x,
                category: c,
              });
            }
          });
      });
      setFilteredItems(mixed_bag);
    }
  }

  useEffect(() => {
    if (selected_items) {
      if (attr['base-only']) {
        const filters: string[] = [];
        const more_input_fields_to_show: string[] = [];
        Object.keys(selected_items).forEach(category => {
          const [group] = (attr['hide-defaults'] ? additional_fields : base_relationships).filter(c => c.category === category);
          if (group) {
            selected_items[category].forEach(num => {
              filters.push(group.items[num - 1]);
            });
          }
        });

        filterEvent.fireEvent({
          filters,
        } as unknown as EventData);
      }
    } else {
      attr.onChange(selected_items);
    }
  }, [selected_items]);

  useEffect(() => {
    if (attr['base-only']) {
      let results: { [k: string]: { id: number; name: string }[] } = {};
      (attr['hide-defaults'] ? additional_fields : base_relationships).map((r, id) => {
        results = {
          ...results,
          [r.category]: r.items.map((name, i) => ({
            id: i + 1,
            name: getLabel(name),
          })),
        };
      });
      setRelationships(results);
    } else
      getPropertyAttributes().then(results => {
        setRelationships(results);
      });
  }, []);

  return relationships ? (
    <>
      <Popover className='relative'>
        {({ open }) => (
          <>
            <Popover.Button className={classNames(attr.className, 'w-full', attr['right-align'] ? 'flex gap-1 items-center justify-between' : '')}>
              <span>{children}</span>

              <ChevronDownIcon
                className={`${open ? 'text-indigo-300' : 'text-indigo-200/70'}
                  ${attr['right-align'] ? '' : 'ml-2'} h-4 w-4 transition duration-150 ease-in-out group-hover:text-orange-300/80`}
                aria-hidden='true'
              />
            </Popover.Button>
            <Transition
              as={Fragment}
              enter='transition ease-out duration-200'
              enterFrom='opacity-0 translate-y-1'
              enterTo='opacity-100 translate-y-0'
              leave='transition ease-in duration-150'
              leaveFrom='opacity-100 translate-y-0'
              leaveTo='opacity-0 translate-y-1'
            >
              <Popover.Panel className={classNames(attr['right-align'] ? 'right-0' : '-translate-x-1/2 left-1/2', styles['popover-panel'])}>
                <div className={classNames(attr['right-align'] ? 'flex bg-white' : '', 'rounded-2xl shadow-xl ring-1 ring-neutral-200/5 overflow-auto')}>
                  <div className={classNames(attr['right-align'] ? 'flex-col' : '', 'bg-[#f3f5fb] p-4 flex overflow-auto gap-4')}>
                    {(attr['base-only'] ? (attr['hide-defaults'] ? additional_fields : base_relationships).map(group => group.category) : only_show).map(
                      name => (
                        <button
                          key={`btn-category-${name}`}
                          type='button'
                          className={classNames(category === name ? 'w--current' : 'bg-transparent', styles['category-button'], 'tab-button-vertical-toggle')}
                          onClick={() => {
                            setCategory(name);
                            setFilteredItems([]);
                          }}
                        >
                          <span className='flex items-center whitespace-nowrap'>
                            <span className='text-sm font-medium text-gray-900'>{getLabel(name)}</span>
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                  <aside className='flex-1'>
                    <div className='bg-white px-4 pt-4'>
                      <div className='relative flex items-center'>
                        <input
                          type='text'
                          name='search'
                          id='search'
                          onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                            filterFields(evt.currentTarget.value);
                          }}
                          className='block w-full rounded-md border-0 py-1.5 pl-4 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6'
                        />
                        <div className='absolute inset-y-0 right-0 flex py-1.5 pr-1.5'>
                          <span className='inline-flex items-center px-1 font-sans text-xs text-gray-400'>
                            <MagnifyingGlassIcon className='w-5 h-5' />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='relative grid gap-6 bg-white p-7 lg:grid-cols-2 max-h-60 overflow-auto'>
                      {all_items && all_items?.length ? (
                        (all_items || []).map(item => (
                          <button
                            key={`${item.category}-${item.id}`}
                            onClick={() => {
                              toggleItem(item.category, item.id);
                            }}
                            className={classNames(
                              '-m-3 flex items-center justify-between rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-orange-500/50 cursor-pointer',
                              selected_items?.[item.category]?.includes(item.id) ? 'bg-neutral-100/10' : 'bg-transparent',
                            )}
                          >
                            <span className='text-sm font-medium text-gray-900 m-0'>{item.name}</span>
                            {selected_items?.[item.category]?.includes(item.id) ? <CheckIcon className='w-5 h-5 fill-green-500' /> : ''}
                          </button>
                        ))
                      ) : category ? (
                        relationships?.[category]?.map(item => (
                          <button
                            key={item.name}
                            onClick={() => {
                              toggleItem(category, item.id);
                            }}
                            className={classNames(
                              '-m-3 flex items-center justify-between rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-orange-500/50 cursor-pointer',
                              selected_items?.[category]?.includes(item.id) ? 'bg-neutral-100/10' : 'bg-transparent',
                            )}
                          >
                            <span className='text-sm font-medium text-gray-900 m-0'>{item.name}</span>
                            {selected_items?.[category]?.includes(item.id) ? <CheckIcon className='w-5 h-5 fill-green-500' /> : ''}
                          </button>
                        ))
                      ) : (
                        <></>
                      )}
                    </div>
                  </aside>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </>
  ) : (
    <></>
  );
}

function IconOne() {
  return (
    <svg width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <rect width='48' height='48' rx='8' fill='#FFEDD5' />
      <path d='M24 11L35.2583 17.5V30.5L24 37L12.7417 30.5V17.5L24 11Z' stroke='#FB923C' strokeWidth='2' />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M16.7417 19.8094V28.1906L24 32.3812L31.2584 28.1906V19.8094L24 15.6188L16.7417 19.8094Z'
        stroke='#FDBA74'
        strokeWidth='2'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M20.7417 22.1196V25.882L24 27.7632L27.2584 25.882V22.1196L24 20.2384L20.7417 22.1196Z'
        stroke='#FDBA74'
        strokeWidth='2'
      />
    </svg>
  );
}

function IconTwo() {
  return (
    <svg width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <rect width='48' height='48' rx='8' fill='#FFEDD5' />
      <path d='M28.0413 20L23.9998 13L19.9585 20M32.0828 27.0001L36.1242 34H28.0415M19.9585 34H11.8755L15.9171 27' stroke='#FB923C' strokeWidth='2' />
      <path fillRule='evenodd' clipRule='evenodd' d='M18.804 30H29.1963L24.0001 21L18.804 30Z' stroke='#FDBA74' strokeWidth='2' />
    </svg>
  );
}

function IconThree() {
  return (
    <svg width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <rect width='48' height='48' rx='8' fill='#FFEDD5' />
      <rect x='13' y='32' width='2' height='4' fill='#FDBA74' />
      <rect x='17' y='28' width='2' height='8' fill='#FDBA74' />
      <rect x='21' y='24' width='2' height='12' fill='#FDBA74' />
      <rect x='25' y='20' width='2' height='16' fill='#FDBA74' />
      <rect x='29' y='16' width='2' height='20' fill='#FB923C' />
      <rect x='33' y='12' width='2' height='24' fill='#FB923C' />
    </svg>
  );
}

function getLabel(name: string) {
  switch (name) {
    case 'hvac':
      return 'Heating & ventilation';
    case 'places_of_interest':
      return 'Nearby attractions';
    default:
      return capitalizeFirstLetter(name.split('_').join(' '));
  }
}
