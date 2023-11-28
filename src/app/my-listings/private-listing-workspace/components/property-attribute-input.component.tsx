import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { classNames } from '@/_utilities/html-helper';
import DynamicInputDropdown from '@/components/Dropdowns/DynamicInputDropdown.module';
import { ReactElement } from 'react';

function getType(name: string) {
  if (name.includes('total')) return 'number';
  if (name.includes('price')) return 'number';
  if (name.includes('floor_area')) return 'number';
  if (['floor_levels', 'frontage', 'num_units_in_community'].includes(name)) return 'number';
  if (name.includes('lot_')) return 'number';
  return 'text';
}

function getLabel(name: string) {
  if (name.includes('complex_compound')) return 'Complex / Compound';
  switch (name) {
    case 'hvac':
      return 'Heating / Ventilation';
    default:
      return capitalizeFirstLetter(name.split('_').join(' '));
  }
}

export default function PropertyAttributeInput({
  onChange,
  name,
  relationships,
  defaultValue,
}: {
  onChange(name: string, value: any): void;
  name: string;
  relationships?: { [k: string]: { id: number; name: string }[] };
  defaultValue?: string | number;
}) {
  let InputField: ReactElement = (
    <input
      type={getType(name)}
      name={name}
      id={`txt_${name}`}
      onChange={evt => onChange(evt.currentTarget.name, getType(name) === 'number' ? Number(evt.currentTarget.value) : evt.currentTarget.value)}
      className='block w-full rounded-md border-0 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
      placeholder={capitalizeFirstLetter(name.split('_').join(' '))}
      defaultValue={defaultValue}
    />
  );
  if (relationships && relationships[name]) {
    InputField = <DynamicInputDropdown direction='up' field-name={name} onSelect={console.log} options={relationships[name]} />;
  }

  return (
    <fieldset className={classNames(['heating', 'video_link'].includes(name) ? 'w-full order-last' : 'w-[48%]', 'flex flex-col gap-1 mt-1')}>
      <label htmlFor={`txt_${name}`} className='block text-sm font-medium leading-6 text-gray-900'>
        {getLabel(name)}
      </label>
      {InputField}
    </fieldset>
  );
}
