import { Filter } from '@/_typings/filters_compare';
import { MLSProperty } from '@/_typings/property';

interface MLSFilteringInterface {
  filters: Filter[];
  property: MLSProperty;
}

export function filterPropertyByKeys({ filters, property }: MLSFilteringInterface) {
  const results: any = {};
  filters.forEach(filter => {
    filter.keys.forEach(key => {
      const value = property[key] ?? 'N/A'; // use nullish coalescing operator to set value to 'N/A' if property[key] is null or undefined
      const newKey = filter.title;
      results[newKey] = value;
    });
  });
  return results;
}
