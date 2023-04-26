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
