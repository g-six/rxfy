import { PropertyDataModel } from '@/_typings/property';

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) has_balcony
 */
export function combineBalconyData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (attributes.has_balcony === true) return attributes;

  if (['B_OutdoorArea', 'L_StrataLotsIncludes', 'L_Exterior Features'].includes(key)) {
    if (
      val &&
      (val.filter(str => str.toLowerCase().indexOf('balcony') >= 0).length > 0 || val.filter(str => str.toLowerCase().indexOf('balcny') >= 0).length > 0)
    ) {
      return {
        ...attributes,
        has_balcony: true,
      };
    }
  }
  return {
    ...attributes,
    has_balcony: attributes.has_balcony || false,
  };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) has_deck
 */
export function combineDeckData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (attributes.has_deck === true) return attributes;
  if (['B_OutdoorArea', 'L_StrataLotsIncludes', 'L_Exterior Features'].includes(key)) {
    if (val && (val.filter(str => str.toLowerCase().indexOf('deck') >= 0).length > 0 || val.filter(str => str.toLowerCase().indexOf('dck') >= 0).length > 0)) {
      return {
        ...attributes,
        has_deck: true,
      };
    }
  }
  return {
    ...attributes,
    has_deck: attributes.has_deck || false,
  };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) has_deck
 */
export function combinePatioData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (attributes.has_patio) return attributes;
  return val &&
    val.length > 0 &&
    ['B_OutdoorArea', 'L_StrataLotsIncludes', 'L_Exterior Features', 'LFD_OutdoorArea_47'].includes(key) &&
    val.filter(str => str.toLowerCase().indexOf('patio') >= 0).length > 0
    ? {
        ...attributes,
        has_patio: true,
      }
    : {
        ...attributes,
        has_patio: attributes.has_patio || false,
      };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) has_deck
 */
export function combineDishwasherData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (attributes.has_dishwasher || !val) return attributes;

  return Array.isArray(val) &&
    val.filter(str => str.toLowerCase().indexOf('dishwasher') >= 0).length &&
    ['L_Features', 'LFD_FeaturesIncluded_55', 'L_Appliances'].includes(key)
    ? {
        ...attributes,
        has_dishwasher: true,
      }
    : {
        ...attributes,
        has_dishwasher: false,
      };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) has_fenced_yard
 */
export function combineFenceData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (attributes.has_fenced_yard) return attributes;

  return Array.isArray(val) &&
    val.filter(str => str.toLowerCase().indexOf('fenced yard') >= 0).length &&
    ['B_OutdoorArea', 'L_StrataLotsIncludes', 'L_Exterior Features', 'LFD_OutdoorArea_47'].includes(key)
    ? {
        ...attributes,
        has_fenced_yard: true,
      }
    : {
        ...attributes,
        has_fenced_yard: false,
      };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) has_storage
 */
export function combineStorageData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (attributes.has_storage) return attributes;

  return Array.isArray(val) && val.filter(str => str.toLowerCase().indexOf('storage') >= 0).length
    ? {
        ...attributes,
        has_storage: true,
      }
    : {
        ...attributes,
        has_storage: false,
      };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) has_deck
 */
export function combineFridgeData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (attributes.has_fridge) return attributes;

  return Array.isArray(val) &&
    val.filter(str => str.toLowerCase().indexOf('fridg') >= 0 || str.toLowerCase().indexOf('frdg') >= 0 || str.toLowerCase().indexOf('refrigerator') >= 0)
      .length &&
    ['L_Features', 'LFD_FeaturesIncluded_55', 'L_Appliances'].includes(key)
    ? {
        ...attributes,
        has_fridge: true,
      }
    : {
        ...attributes,
        has_fridge: false,
      };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) HVAC
 */
export function combineHVACData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  return ['L_Features', 'LFD_FeaturesIncluded_55', 'L_Appliances'].includes(key) &&
    val &&
    val.filter(str => {
      return (
        str.toLowerCase().indexOf('air condition') >= 0 ||
        str.toLowerCase().indexOf('electric') >= 0 ||
        str.toLowerCase().indexOf('heat pump') >= 0 ||
        str.toLowerCase().indexOf('heat recovery') >= 0
      );
    }).length
    ? {
        ...attributes,
        has_hvac: true,
      }
    : attributes;
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) has_deck
 */
export function combineStoveData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  return ['L_Features', 'LFD_FeaturesIncluded_55', 'L_Appliances'].includes(key) &&
    val &&
    val.filter(
      str =>
        str.toLowerCase().indexOf('range elect') >= 0 ||
        str.toLowerCase().indexOf('range gas') >= 0 ||
        str.toLowerCase().indexOf('stove') >= 0 ||
        str.toLowerCase().indexOf('stve') >= 0,
    ).length
    ? {
        ...attributes,
        has_stove: true,
      }
    : {
        ...attributes,
        has_stove: attributes.has_stove || false,
      };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) has_deck
 */
export function combineWasherDryerData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (!key || !val || attributes.has_laundry === true) return attributes;

  if (
    ['L_Features', 'LFD_FeaturesIncluded_55', 'LFD_Amenities_56'].includes(key) &&
    val &&
    val.filter(
      str =>
        str.toLowerCase().indexOf('washer') >= 0 ||
        str.toLowerCase().indexOf('dryer') >= 0 ||
        str.toLowerCase().indexOf('clthwsh') >= 0 ||
        str.toLowerCase().indexOf('laundry') >= 0,
    ).length
  ) {
    return {
      ...attributes,
      has_laundry: true,
    };
  }
  if (key === 'L_LaundyFeatures' && val.filter(str => str.toLowerCase().indexOf('in house') >= 0).length) {
    return {
      ...attributes,
      has_laundry: true,
    };
  }
  return {
    ...attributes,
    has_laundry: false,
  };
}

/**
 *
 * @param attributes PropertyDataModel
 * @param key
 * @param val
 * @returns PropertyDataModel with (or w/out) parking
 */
export function combineParkingData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  let parking = attributes.parking || '';
  let garage = attributes.garage || 'None';

  if (val && key.toLowerCase().indexOf('parking') >= 0) {
    let text = '';
    if (Array.isArray(val)) {
      text = val.join(' ');
    } else {
      switch (key.toUpperCase()) {
        case 'L_PARKING_COVERED':
          text = `${val} covered`;
          break;
        case 'L_PARKING_TOTAL':
          text = `${val} total`;
          break;
      }
    }
    parking = `${parking ? `${parking}, ` : ''}` + text;

    if (garage === 'None' && parking) {
      if (parking.toLowerCase().indexOf('garage; triple') >= 0) garage = 'Triple';
      if (parking.toLowerCase().indexOf('garage; double') >= 0) garage = 'Double';
      if (parking.toLowerCase().indexOf('garage; single') >= 0) garage = 'Single';
    }

    return {
      ...attributes,
      parking,
      garage,
    };
  }
  return {
    ...attributes,
    parking,
    garage,
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
