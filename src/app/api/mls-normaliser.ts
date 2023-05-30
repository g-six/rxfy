import { PropertyDataModel } from '@/_typings/property';

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel
 */
export function combineComplexCompoundName(attributes: PropertyDataModel, key: string, val?: string | string[]): PropertyDataModel {
  if (attributes.complex_compound_name || (key.indexOf('ComplexName') === -1 && key.indexOf('Compound') === -1) || !val) return attributes;
  if (val) {
    return {
      ...attributes,
      complex_compound_name: val as string,
    };
  }
  return attributes;
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel
 */
export function combineFrontageData(attributes: PropertyDataModel, key: string, val?: unknown): PropertyDataModel {
  let size = 0;
  if (Array.isArray(val)) size = Number(val.join(''));
  else size = Number(val);
  if (key.indexOf('Frontage') >= 0 && size) {
    if (key.indexOf('Metre') >= 0 || key.indexOf('Meter') >= 0) {
      return {
        ...attributes,
        frontage_metres: size,
      };
    } else if (key.indexOf('Feet') >= 0) {
      return {
        ...attributes,
        frontage_feet: size,
      };
    }
  }
  return attributes;
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel
 */
export function combineFloorageAreaData(attributes: PropertyDataModel, key: string, val: string): PropertyDataModel {
  const key_id = key.toLowerCase();
  if (key_id.indexOf('floorarea') >= 0 && !isNaN(Number(val))) {
    if (key.indexOf('Total') >= 0) {
      return {
        ...attributes,
        floor_area_total: Number(val),
      };
    } else if (key.indexOf('Above') >= 0 || key.indexOf('Upper') >= 0) {
      return {
        ...attributes,
        floor_area_upper_floors: Number(val),
      };
    } else if (key.indexOf('Basement') >= 0) {
      return {
        ...attributes,
        floor_area_basement: Number(val),
      };
    } else if (key.indexOf('Unfinished') >= 0) {
      return {
        ...attributes,
        floor_area_unfinished: Number(val),
      };
    }
  }
  return attributes;
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel
 */
export function combineFoundationSpecsData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  let foundation_specs = attributes.foundation_specs || '';
  if (key.indexOf('Foundation') >= 0 && val) {
    foundation_specs = foundation_specs ? foundation_specs + ' / ' : '';
    foundation_specs = `${foundation_specs}${val.join(' / ')}`;
    return {
      ...attributes,
      foundation_specs,
    };
  }
  return attributes;
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel
 */
export function combineOtherAppliancesData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (['L_Features', 'LFD_FeaturesIncluded_55', 'LFD_Amenities_56'].includes(key) && val) {
    return {
      ...attributes,
      other_appliances: val
        .filter(str => str.toLowerCase().indexOf('microwave') >= 0 || str.toLowerCase().indexOf('wine') >= 0 || str.toLowerCase().indexOf('vacuum') >= 0)
        .join(' / '),
    };
  }
  return attributes;
}

function isValueLikelyNeeded(key: string, val: string[] | string | number) {
  if (!val) return '';
  let value = Array.isArray(val) ? val.join(' / ') : `${val}`;
  if (key.toLowerCase().indexOf('driveway') >= 0) {
    return `${value} driveway`;
  }
  if (key.toLowerCase().indexOf('parking') >= 0 && key.toLowerCase().indexOf('access') >= 0) {
    return `${value} parking access`;
  }
  if (key.toLowerCase().indexOf('workshop') >= 0) {
    return `${value} workshop`;
  }
  if (key.toLowerCase().indexOf('garage') >= 0) {
    return `${value} garage`;
  }
  if (key.toLowerCase().indexOf('construction') >= 0) {
    return `${value} construction`;
  }
  if (key.toLowerCase().indexOf('influence') >= 0) {
    return `${(val as string[]).join('\n• ')}`;
  }
  if (key.indexOf('FloorFinish') >= 0 && Array.isArray(val)) {
    return `${val.join(' + ')} floor finish`;
  }
  if (key.indexOf('BasementArea') >= 0) {
    return `${value} basement`;
  }
  if (key.indexOf('Parking') >= 0) {
    return `${Array.isArray(val) ? val.join(' ') : val}${
      key.toLowerCase().indexOf('covered') >= 0 ? ' covered parking' : ` parking${!isNaN(Number(val)) ? ' space in total' : ''}`
    }`;
  }
  if (key.indexOf('_Frontage_') >= 0) {
    const uom = key.split('_Frontage_').pop();
    if (uom && ['metres', 'meters', 'feet'].includes(uom.toLowerCase())) {
      return '';
    } else {
      return `Frontage: ${val} ${key.split('_Frontage_').pop()}`;
    }
  }
  return '';
}
/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel
 */
export function combineOtherInformation(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  let other_information = attributes.other_information || '';

  if (!val) return attributes;

  const add_this = isValueLikelyNeeded(key, val);

  if (!add_this) return attributes;

  other_information = other_information ? [other_information, add_this].join('\n• ') : `• ${add_this}`;

  return {
    ...attributes,
    other_information,
  };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) fireplace
 */
export function combineFireplaceData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (attributes.fireplace) return attributes;
  if (val && ['L_FireplacesFeatures', 'L_Fireplace_Fuel'].includes(key)) {
    return {
      ...attributes,
      fireplace: val.concat(attributes.fireplace ? [attributes.fireplace] : []).join(', \n'),
    };
  }
  return {
    ...attributes,
    fireplace: undefined,
  };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) roof
 */
export function combineRoofData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  return val && key === 'B_Roof'
    ? {
        ...attributes,
        roofing: val.concat(attributes.roofing ? [attributes.roofing] : []).join(', '),
      }
    : {
        ...attributes,
        roofing: attributes.roofing || undefined,
      };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) roof
 */
export function setStyleType(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  return val && key === 'B_Style'
    ? {
        ...attributes,
        style_type: val.concat(attributes.style_type ? [attributes.style_type] : []).join(', '),
      }
    : {
        ...attributes,
        style_type: attributes.style_type || undefined,
      };
}
