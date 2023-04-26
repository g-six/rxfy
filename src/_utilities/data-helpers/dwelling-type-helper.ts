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

export function getSelectedPropertyTypeId(property_type: string) {
  switch (property_type) {
    case 'house':
      return [3, 4, 11, 12];
    case 'aptcondo':
      return [1];
    case 'tnhouse':
      return [2];
    case 'duplex':
      return [8, 9];
    case 'nonstrata':
      return [5];
    case 'manufactured':
      return [6, 7];
    case 'others':
      return [10];
    default:
      return [];
  }
}
