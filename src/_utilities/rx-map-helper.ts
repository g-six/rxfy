'use client';

import { cloneElement } from 'react';
import { RxPropertyMapProps } from '@/_typings/maps';

function descreaseBeds() {
  const currentUrl = new URL(window.location.href);
  let num_of_beds = Number(currentUrl.searchParams.get('beds') || '0');
  if (num_of_beds > 1) {
    num_of_beds = num_of_beds - 1;
    currentUrl.searchParams.set('beds', `${num_of_beds}`);
    window.history.pushState({}, `beds=${num_of_beds}`, currentUrl.href);
  }
}

function increaseBeds() {
  const currentUrl = new URL(window.location.href);
  let num_of_beds = Number(currentUrl.searchParams.get('beds') || '0');
  num_of_beds = num_of_beds + 1;
  currentUrl.searchParams.set('beds', `${num_of_beds}`);
  window.history.pushState({}, `beds=${num_of_beds}`, currentUrl.href);
}

export default function rxfyBedsAndBaths({ parentProps, child }: { parentProps: RxPropertyMapProps; child: any }) {
  if (child.props.className && child.props.className?.indexOf('beds-less') >= 0) {
    return cloneElement(child, {
      onClick: () => {
        descreaseBeds();
      },
    });
  }

  if (child.props.className && child.props.className?.indexOf('beds-more') >= 0) {
    return cloneElement(child, {
      onClick: () => {
        increaseBeds();
      },
    });
  }
}

export function getShortPrice(amount: number, prefix = '$') {
  const str = `${Math.round(amount / 1000)}`;
  if (amount < 1000000) {
    return `${prefix}${str}K`;
  }

  if (str.substring(1, 2) !== '0') {
    const x = Math.round(parseInt(str.substring(1), 10) / 100);
    if (x < 10) return `${prefix}${str.substring(0, 1)}.${x}M`;
    else return `${prefix}${str.substring(0, 1)}M`;
  }

  return `${prefix}${Math.round(amount / 1000000)}M`;
}

export function getSortingKey(class_name: string) {
  if (class_name.indexOf('date-asc') >= 0) return 'date_asc';
  if (class_name.indexOf('date-desc') >= 0) return 'date_desc';
  if (class_name.indexOf('price-asc') >= 0) return 'price_asc';
  if (class_name.indexOf('price-desc') >= 0) return 'price_desc';
  if (class_name.indexOf('size-asc') >= 0) return 'size_asc';
  if (class_name.indexOf('size-desc') >= 0) return 'size_desc';
  return '';
}

export function getPropertyTypeFromSelector(class_name: string) {
  let idx = class_name.indexOf('ptype-house');
  if (idx === -1) idx = class_name.indexOf('ptype-aptcondo');
  if (idx === -1) idx = class_name.indexOf('ptype-tnhouse');
  if (idx === -1) idx = class_name.indexOf('ptype-duplex');
  if (idx === -1) idx = class_name.indexOf('ptype-nonstrata');
  if (idx === -1) idx = class_name.indexOf('ptype-manufactured');
  if (idx === -1) idx = class_name.indexOf('ptype-others');

  if (idx >= 0) {
    return class_name.substring(idx + 6, idx + class_name.substring(idx).split(' ')[0].length);
  }
  return '';
}
export function getSelectedPropertyTypes(property_type: string) {
  switch (property_type) {
    case 'house':
      return ['Single Family Detached', 'Residential Detached', 'House with Acreage', 'House/Single Family'];
    case 'aptcondo':
      return ['Apartment/Condo'];
    case 'tnhouse':
      return ['Townhouse'];
    case 'duplex':
      return ['Half Duplex', '1/2 Duplex', 'Duplex'];
    case 'nonstrata':
      break;
    case 'manufactured':
      break;
    case 'others':
      break;
    default:
      return [];
  }
}
