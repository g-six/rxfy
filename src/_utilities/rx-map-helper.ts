'use client';

import { MapboxBoundaries, RxPropertyFilter } from '@/_typings/maps';
import { PropertyAttributeFilters } from '@/_typings/property';
import Cookies from 'js-cookie';
import { getSelectedPropertyTypes } from './data-helpers/dwelling-type-helper';

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
  let minmax: {
    gte?: number;
    lte?: number;
  } = {
    gte: min,
  };
  if (max && max > min) {
    minmax.lte = max;
  }

  filter.push({
    range: {
      [`data.${field}`]: minmax,
    },
  });
  return filter;
}

function includeTermsFilter(filter: RxPropertyFilter[], field: string, terms: string[]): RxPropertyFilter[] {
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
  ];

  results = includeGreaterOrEqualNumberFilter(results, 'L_BedroomTotal', q.beds);
  results = includeGreaterOrEqualNumberFilter(results, 'L_TotalBaths', q.baths);
  results = includeRangeFilter(results, 'AskingPrice', q.minprice, q.maxprice);
  results = includeRangeFilter(results, 'L_FloorArea_GrantTotal', q.minsqft, q.maxsqft);
  if (q.tags && q.tags.length) {
    results = includeTermsFilter(results, 'L_PublicRemakrs', q.tags);
  }
  if (q.types && q.types.length) {
    let property_types: string[] = [];
    q.types.forEach((t: string) => {
      property_types = property_types.concat(getSelectedPropertyTypes(t));
    });
    results = includeTermsFilter(results, 'Type', property_types);
  }

  if (q.dt_from) {
    results = includeGreaterOrEqualNumberFilter(results, 'ListingDate', Math.floor(q.dt_from.getTime() / 1000));
  }

  return results;
}
