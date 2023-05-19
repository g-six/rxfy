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
    if (val && Array.isArray(val)) {
      if (
        val.filter(balcony_str => balcony_str.toLowerCase().indexOf('balcony') >= 0).length > 0 ||
        val.filter(balcony_str => balcony_str.toLowerCase().indexOf('balcny') >= 0).length > 0
      ) {
        return {
          ...attributes,
          has_balcony: true,
        };
      }
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
    if (
      val &&
      (val.filter(deck_str => `${deck_str}`.toLowerCase().indexOf('deck') >= 0).length > 0 ||
        val.filter(deck_str => `${deck_str}`.toLowerCase().indexOf('dck') >= 0).length > 0)
    ) {
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
    val.filter(patio_str => `${patio_str}`.toLowerCase().indexOf('patio') >= 0).length > 0
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
    val.filter(dish_str => `${dish_str}`.toLowerCase().indexOf('dishwasher') >= 0 || `${dish_str}`.toLowerCase().split('/').includes('dw')).length &&
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
  if (attributes.has_fenced_yard || !val || !Array.isArray(val)) return attributes;
  return val.length &&
    val.filter(fence_str => `${fence_str}`.toLowerCase().indexOf('fenced yard') >= 0).length &&
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

  return Array.isArray(val) && val.filter(str => `${str}`.toLowerCase().indexOf('storage') >= 0).length
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
    val.filter(
      fridge_str =>
        `${fridge_str}`.toLowerCase().indexOf('fridg') >= 0 ||
        `${fridge_str}`.toLowerCase().indexOf('frdg') >= 0 ||
        `${fridge_str}`.toLowerCase().indexOf('refrigerator') >= 0,
    ).length &&
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
  if (['L_Features', 'LFD_FeaturesIncluded_55', 'L_Appliances'].includes(key) && val) {
    const features = val.filter(str => {
      return (
        str.toLowerCase().indexOf('air condition') >= 0 ||
        str.toLowerCase().indexOf('electric') >= 0 ||
        str.toLowerCase().indexOf('heat pump') >= 0 ||
        str.toLowerCase().indexOf('heat recovery') >= 0
      );
    });
    if (features.length) {
      return {
        ...attributes,
        has_hvac: true,
        hvac_features: features.join(' / '),
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
 * @returns PropertyDataModel
 */
export function combineSafetySecurityData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (['L_Features', 'LFD_FeaturesIncluded_55', 'LFD_Amenities_56'].includes(key) && val) {
    return {
      ...attributes,
      safety_security_features: val.filter(str => str.toLowerCase().indexOf('security') >= 0 || str.toLowerCase().indexOf('smoke') >= 0).join(' / '),
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
export function combineGardenLawnData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  if (['L_Features', 'LFD_FeaturesIncluded_55', 'LFD_Amenities_56', 'B_Amenities'].includes(key) && val) {
    return {
      ...attributes,
      garden_lawn_features: val
        .filter(str => str.toLowerCase().indexOf('sprinkler') >= 0 || str.toLowerCase().indexOf('garden') >= 0 || str.toLowerCase().indexOf('workshop') >= 0)
        .join(' / '),
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
export function combineConstructionData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  let construction_information = attributes.construction_information || '';
  if (key.indexOf('Construction') >= 0 && val) {
    if (!Array.isArray(val)) {
      console.log('combineConstructionData error:', 'val is not an Array');
      console.log('key: val', key, val);
    } else {
      construction_information = construction_information ? construction_information + ' / ' : '';
      construction_information = `${construction_information}${val.join(' / ')}`;
      return {
        ...attributes,
        construction_information,
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
export function combineExteriorFinishData(attributes: PropertyDataModel, key: string, val?: string[]): PropertyDataModel {
  return val && key === 'B_Exterior_Finish'
    ? {
        ...attributes,
        exterior_finish: val.concat(attributes.exterior_finish ? [attributes.exterior_finish] : []).join('/'),
      }
    : {
        ...attributes,
        exterior_finish: attributes.exterior_finish || undefined,
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
