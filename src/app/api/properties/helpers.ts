import {
  AMENITY_RELATED_FIELDS,
  APPLIANCE_RELATED_FIELDS,
  BUILD_RELATED_FIELDS,
  FACILITY_RELATED_FIELDS,
  FIELD_CATEGORY,
  FLOORING_RELATED_FIELDS,
  HVAC_RELATED_FIELDS,
  KeyValuePair,
  LegacyPipelineFields,
  PARKING_RELATED_FIELDS,
  PropertyAttributes,
  PropertyRelationships,
  SERVICES_RELATED_FIELDS,
  WATER_SUPPLY_RELATED_FIELDS,
} from './types';

const SYNONYMS: {
  [k: string]: string;
} = {
  'AIR COND./CENTRAL': 'Central Air Conditioning',
  'OVEN - BUILT IN': 'Built In Oven',
  'SPRINKLER - FIRE': 'Sprinkler System',
};
const APPLIANCE_FIELDS = ['L_Features', 'LFD_FeaturesIncluded_55'];
const CONSTRUCTION_FIELDS = ['B_ConstructionMaterials', 'B_Construction', 'B_Exterior_Finish', 'LFD_Construction_41'];
const PARKING_FIELDS = ['LFD_Parking_44', 'B_Parking_Type', 'LFD_ParkingAccess_45'];
const WINDOW_FIELDS = ['L_WindowFeatures'];

export function normalizeApplianceName(name: string) {
  switch (name) {
    case 'ClthWsh':
    case 'Washing Machine':
      return 'Washing Machine';
    case 'Dryr':
      return 'Dryer';
    case 'Frdg':
    case 'Fridg':
    case 'Frige':
    case 'Fridge':
      return 'Refrigerator';
    case 'Stve':
      return 'Stove';
    case 'Vacuum':
      return 'Vacuum Cleaner';
    case 'DW':
    case 'Dsh':
    case 'Dish':
      return 'Dishwasher';
    default:
      return name;
  }
}

export function normalizeParkingName(name: string) {
  if (name === 'Carport & Garage' || name === 'Garage & Carport') return 'Carport & Garage';
  if (name.indexOf('Carport ') === 0 || name.indexOf('Garage ') === 0) {
    const [left, right] = name.split(' ', 2);
    return `${right} ${left}`;
  }
  if (name === 'DetachedGrge/Carport') {
    return 'Detached Garage / Carport';
  }
  if (['Grge/Double Tandem', 'Garage Double'].includes(name)) {
    return 'Double Garage';
  }
  if (name.indexOf('Grge') >= 0) {
    return name.split('Grge').join(' Garage').split('  ').join(' ').trim();
  }
  if (name === 'Garage Underbuilding') {
    return 'Underground Garage';
  }
  if (name.indexOf('Add.') >= 0 || name.indexOf('Additional') >= 0) {
    return 'Other';
  }
  if (name.indexOf('Avail.') >= 0 || name.indexOf('Available') >= 0) {
    return name.split(' ').reverse().pop();
  }
  if (name.indexOf('Visitor') >= 0 || name.indexOf('Guest') >= 0) {
    return 'Visitor';
  }
  if (['Side', 'Sidewalk'].includes(name)) {
    return 'On Street';
  }
  if (['Attached'].includes(name)) {
    return 'Attached Garage / Carport';
  }
  if (['Detached'].includes(name)) {
    return 'Detached Garage / Carport';
  }
  if (name === 'RV Access/Parking') {
    return 'RV';
  }
  const [left, right] = name.split(';', 2).map(s => s.trim());

  if (!left) {
    return name;
  }

  if (['garage', 'carport'].includes(left.toLowerCase())) {
    return `${right} ${left}`;
  }
  return [left, right].join(' ').trim();
}

export function getAssociatedAmenities(mls_data: Record<string, any>, amenities: KeyValuePair[]) {
  let resultset: number[] = [];

  AMENITY_RELATED_FIELDS.forEach(legacy => {
    resultset = resultset.concat(getAssocIDs(mls_data, 'amenities', legacy, amenities).amenities);
  });

  return resultset;
}

export function getAssociatedAppliances(mls_data: Record<string, any>, appliances: KeyValuePair[]) {
  let resultset: number[] = [];
  APPLIANCE_RELATED_FIELDS.forEach(legacy => {
    resultset = resultset.concat(
      getAssocIDs(
        mls_data,
        'appliances',
        legacy,
        appliances.filter(aid => !resultset.includes(aid.id)),
      ).appliances,
    );
  });
  return resultset;
}

export function getAssociatedBuildFeatures(mls_data: Record<string, any>, build_features: KeyValuePair[]) {
  let resultset: number[] = [];
  BUILD_RELATED_FIELDS.forEach(legacy => {
    resultset = resultset.concat(getAssocIDs(mls_data, 'build_features', legacy, build_features).build_features.filter(sid => !resultset.includes(sid)));
  });

  return resultset;
}

export function getAssociatedConnectedServices(mls_data: Record<string, any>, associations: KeyValuePair[]) {
  let resultset: number[] = [];
  SERVICES_RELATED_FIELDS.forEach(legacy => {
    resultset = resultset.concat(
      getAssocIDs(mls_data, 'connected_services', legacy, associations).connected_services.filter(service_id => !resultset.includes(service_id)),
    );
  });
  return resultset;
}

export function getAssociatedFacilities(mls_data: Record<string, any>, associations: KeyValuePair[]) {
  let resultset: number[] = [];
  FACILITY_RELATED_FIELDS.forEach(legacy => {
    resultset = resultset.concat(
      getAssocIDs(
        mls_data,
        'facilities',
        legacy,
        associations.filter(aid => !resultset.includes(aid.id)),
      ).facilities,
    );
    // resultset = resultset.concat(
    //   getAssocIDs(
    //     mls_data,
    //     'facilities',
    //     legacy,
    //     associations.filter(aid => !resultset.includes(aid.id)),
    //   ).facilities,
    // );
  });
  return resultset;
}

export function getAssociatedHvac(mls_data: Record<string, any>, hvac: KeyValuePair[]) {
  let resultset: number[] = [];

  HVAC_RELATED_FIELDS.forEach(legacy => {
    resultset = resultset.concat(getAssocIDs(mls_data, 'hvac', legacy, hvac).hvac);
  });
  return resultset;
}

export function getAssociatedParking(mls_data: Record<string, any>, parking: KeyValuePair[]) {
  let resultset: number[] = [];
  PARKING_RELATED_FIELDS.forEach(legacy => {
    resultset = resultset.concat(getAssocIDs(mls_data, 'parking', legacy, parking).parking);
  });
  return resultset;
}

export function getAssociatedPlacesOfInterests(mls_data: Record<string, any>, places_of_interest: KeyValuePair[]) {
  return getAssocIDs(mls_data, 'places_of_interest', 'LFD_SiteInfluences_46', places_of_interest).places_of_interest;
}

export function getAssociatedPetsAllowed(mls_data: Record<string, any>, pets_allowed: KeyValuePair[]) {
  let resultset: number[] = [];
  resultset = getAssocIDs(mls_data, 'pets_allowed', 'L_Dogs', pets_allowed).pets_allowed.filter(aid => !resultset.includes(aid)) || [];
  resultset = resultset.concat(getAssocIDs(mls_data, 'pets_allowed', 'L_Cats', pets_allowed).pets_allowed.filter(aid => !resultset.includes(aid)));

  if (mls_data.LFD_BylawRestrictions_58) {
    const pet_policy = mls_data.LFD_BylawRestrictions_58.filter((s: string) => s.indexOf('Pets Allowed') >= 0);
    const strict_pet_policy = pet_policy.filter((s: string) => s.toLowerCase().indexOf('w/rest') >= 0 || s.indexOf(' Rest') >= 0);
    if (strict_pet_policy.length) resultset = pets_allowed.filter(({ name }) => name === 'Certain pets allowed').map(({ id }) => id);
    else resultset = pets_allowed.filter(({ name }) => name !== 'Certain pets allowed').map(({ id }) => id);
  }
  return resultset;
}

export function getAssocIDs(
  mls_data: { [key: string]: string | string[] },
  attribute: PropertyRelationships,
  legacy_field: LegacyPipelineFields,
  index: KeyValuePair[],
) {
  const ids: number[] = [];
  let category = '';
  if (CONSTRUCTION_FIELDS.includes(legacy_field)) {
    category = FIELD_CATEGORY.Construction;
  }
  if (FLOORING_RELATED_FIELDS.includes(legacy_field)) {
    category = FIELD_CATEGORY.Flooring;
  }
  if (WINDOW_FIELDS.includes(legacy_field)) {
    category = FIELD_CATEGORY.Window;
  }
  if (PARKING_FIELDS.includes(legacy_field)) {
    category = FIELD_CATEGORY.Parking;
  }

  let iteratable = mls_data[legacy_field];
  if (APPLIANCE_FIELDS.includes(legacy_field)) {
    // Bad formatting, live with it
    // ClthWsh/Dryr/Frdg/Stve/DW
    let appliances_csv = '';
    if (Array.isArray(mls_data[legacy_field])) {
      appliances_csv = (mls_data[legacy_field] as string[]).join('/');
    } else if (mls_data[legacy_field]) {
      appliances_csv = mls_data[legacy_field] as string;
    }
    iteratable = appliances_csv.split('/');
    category = FIELD_CATEGORY.Appliance;
  }

  try {
    index.forEach(({ id, name }) => {
      if (name && mls_data[legacy_field]) {
        if (!Array.isArray(mls_data[legacy_field])) {
          let legacy_value = mls_data[legacy_field] as string;

          if (WATER_SUPPLY_RELATED_FIELDS.includes(legacy_field)) {
            legacy_value = `${legacy_value} Water Supply`;
          } else if (legacy_field === 'L_Dogs' && `${mls_data[legacy_field]}`.toUpperCase() === 'YES') {
            legacy_value = `Dog`;
          } else if (legacy_field === 'L_Cats' && `${mls_data[legacy_field]}`.toUpperCase() === 'YES') {
            legacy_value = `Cat`;
          } else if (legacy_field === 'L_OtherStructures' && `${mls_data[legacy_field]}`.toUpperCase().indexOf('STORAGE') >= 0) {
            legacy_value = `Storage`;
          } else if (legacy_field === 'L_Locker' && legacy_value.toUpperCase() === 'YES') {
            legacy_value = 'Locker';
          }

          if (name !== legacy_value) {
            legacy_value = getKeyVariation(name, legacy_value, category) as string;
          }

          if (name === legacy_value) {
            ids.push(id);
          }
        } else {
          (iteratable as string[]).forEach((val: string) => {
            let legacy_value = val;

            if (attribute === 'connected_services' && legacy_field === 'L_Sewer' && mls_data[legacy_field].includes('Sewer Connected')) {
              legacy_value = 'Sewage';
            } else if (WATER_SUPPLY_RELATED_FIELDS.includes(legacy_field)) {
              legacy_value = `${val} Water Supply`;
            } else if (legacy_field === 'L_OtherStructures' && `${val}`.toUpperCase().indexOf('STORAGE') >= 0) {
              legacy_value = `Storage`;
            } else if (PARKING_FIELDS.includes(legacy_field)) {
              legacy_value = getKeyVariation(name, legacy_value, 'Parking') as string;
            }

            if (name !== legacy_value) {
              legacy_value = getKeyVariation(name, legacy_value, category) as string;
            }
            if (name === legacy_value) {
              ids.push(id);
            }
          });
        }
      }
    });
  } catch (e) {
    console.log('Error in getAssocIDs');
    console.log(e);
  }
  return {
    [attribute]: ids,
  };
}

function getKeyVariation(attribute_name: string, odd_name: string, category = '') {
  let odd_key = odd_name.toLowerCase();
  if (SYNONYMS[odd_name.toUpperCase()]) {
    odd_key = SYNONYMS[odd_name.toUpperCase()].toLowerCase();
  }
  if (odd_name.toLowerCase().indexOf('garage;') >= 0 || odd_name.toLowerCase().indexOf('carport;') >= 0) {
    const [left, right] = odd_name.split(';', 2);
    odd_key = `${right} ${left}`.trim();
  }
  const attribute_key = attribute_name.toLowerCase();

  try {
    if (odd_key.indexOf(attribute_key) >= 0 || odd_key === attribute_name) {
      return attribute_name;
    }
    switch (category) {
      case FIELD_CATEGORY.Construction:
        switch (odd_key) {
          case 'cement fibre':
          case 'fibre cement board':
            return attribute_name === `${category} - Cement Fibre` ? attribute_name : odd_name;
          case 'frame wood':
          case 'frame - wood':
            return attribute_name === `${category} - Wooden Frame` ? attribute_name : odd_name;
          case 'insulation: walls':
            return attribute_name === 'Insulated Walls' ? attribute_name : odd_name;
          default:
            return attribute_name === `${category} - ${odd_name}` ? attribute_name : odd_name;
        }
        break;
      case FIELD_CATEGORY.Flooring:
      case FIELD_CATEGORY.Window:
        return attribute_name === `${category} - ${odd_name}` ? attribute_name : odd_name;
      case FIELD_CATEGORY.Appliance:
        return normalizeApplianceName(odd_name);
      case FIELD_CATEGORY.Parking:
        return normalizeParkingName(odd_name);
    }
    switch (attribute_key) {
      case 'balcony':
        return odd_key.indexOf('balcny') >= 0 || odd_key.indexOf('balcony') >= 0 || odd_key.indexOf('balconi') >= 0 ? attribute_name : odd_name;
      case 'deck':
        return odd_key.indexOf('dck') >= 0 || odd_key.indexOf('deck') >= 0 ? attribute_name : odd_name;
      case 'patio':
        return odd_key.indexOf('patio') >= 0 ? attribute_name : odd_name;
      case 'bird':
        return odd_key.indexOf('bird') >= 0 ? attribute_name : odd_name;
      case 'cat':
        return odd_key.indexOf('cat') >= 0 ? attribute_name : odd_name;
      case 'dog':
        return odd_key.indexOf('dog') >= 0 ? attribute_name : odd_name;
      case 'shopping mall':
        return odd_key.indexOf('shopping') >= 0 ? attribute_name : odd_name;
      case 'recreational area':
        return odd_key.indexOf('recreation') >= 0 ? attribute_name : odd_name;
      case 'city / town centre':
        return odd_key.indexOf('central') >= 0 ? attribute_name : odd_name;
      case 'washing machine':
        return odd_key.indexOf('in unit') >= 0 || odd_key.indexOf('in suite') >= 0 ? attribute_name : odd_name;
      case 'sprinkler system':
        return odd_key.indexOf('sprinkler') >= 0 || odd_key.indexOf('fire') >= 0 ? attribute_name : odd_name;
      case 'trash removal':
        return odd_key.indexOf('trash') >= 0 || odd_key.indexOf('garbage') >= 0 ? attribute_name : odd_name;
      default:
        return odd_name;
    }
  } catch (e) {
    console.log('Error in getKeyVariation');
    console.error(e);
  }
}
