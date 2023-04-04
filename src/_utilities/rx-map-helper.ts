'use client';

import { MapboxBoundaries, RxPropertyFilter } from '@/_typings/maps';
import { PropertyAttributeFilters } from '@/_typings/property';

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
      return ['Row House (Non-Strata)'];
    case 'manufactured':
      return ['Manufactured', 'Manufactured with Land'];
    case 'others':
      return ['Other'];
    default:
      return [];
  }
}

function includeGreaterOrEqualNumberFilter(filter: RxPropertyFilter[], field: string, count?: number): RxPropertyFilter[] {
  if (count)
    filter.push({
      range: {
        [`data.${field}`]: {
          gte: count,
        },
      },
    });
  return filter;
}

function includeLesserOrEqualNumberFilter(filter: RxPropertyFilter[], field: string, count?: number): RxPropertyFilter[] {
  if (count)
    filter.push({
      range: {
        [`data.${field}`]: {
          lte: count,
        },
      },
    });
  return filter;
}
function includeRangeFilter(filter: RxPropertyFilter[], field: string, min = 0, max?: number): RxPropertyFilter[] {
  filter.push({
    range: {
      [`data.${field}`]: {
        gte: min,
        lte: max,
      },
    },
  });
  return filter;
}

function includeTermsFilter(filter: RxPropertyFilter[], field: 'Type', terms: string[]): RxPropertyFilter[] {
  if (terms.length > 0)
    filter.push({
      terms: {
        [`data.${field}`]: terms,
      },
    });
  return filter;
}

export function getSearchPropertyFilters(q: MapboxBoundaries & PropertyAttributeFilters): RxPropertyFilter[] {
  let results: RxPropertyFilter[] = [
    {
      range: {
        'data.lat': {
          gte: q.swlat,
          lte: q.nelat,
        },
      },
    },
    {
      range: {
        'data.lng': {
          gte: q.swlng,
          lte: q.nelng,
        },
      },
    },
    {
      match: {
        'data.Status': 'Active',
      },
    },
  ];

  results = includeGreaterOrEqualNumberFilter(results, 'L_BedroomTotal', q.beds);
  results = includeGreaterOrEqualNumberFilter(results, 'L_TotalBaths', q.baths);
  results = includeRangeFilter(results, 'AskingPrice', q.minprice, q.maxprice);
  results = includeRangeFilter(results, 'L_FloorArea_Total', q.minsqft, q.maxsqft);

  if (q.types && q.types.length) {
    let property_types: string[] = [];
    q.types.forEach((t: string) => {
      property_types = property_types.concat(getSelectedPropertyTypes(t));
    });
    results = includeTermsFilter(results, 'Type', property_types);
  }

  return results;
}
