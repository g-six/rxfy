import { MLSProperty, PropertyStatus } from '@/_typings/property';

export function mapProperties(properties: MLSProperty[]) {
  let mapped: any = [];
  if (properties && properties.length) {
    properties.forEach((it, i) => {
      const item = mapListProperty(it);
      if (item) {
        mapped.push(item);
      }
    });
  }

  return mapped;
}

function mapListProperty(it: MLSProperty) {
  let mapped = null;
  let prefix = '';
  const fields = it;
  if (fields && Object.keys(fields).length) {
    const agent = {
      company: fields[prefix + 'LA1_FullName'] || '',
      email: fields[prefix + 'LA1_Email'] || '',
      phone: fields[prefix + 'LA1_PhoneNumber1'] || '',
    };
    const agents = [fields[prefix + 'LA1_LoginName'] || '', fields[prefix + 'LA2_LoginName'] || '', fields[prefix + 'LA3_LoginName'] || ''];
    const offices = [fields[prefix + 'ListOffice1'] || '', fields[prefix + 'ListOffice2'] || '', fields[prefix + 'ListOffice3'] || ''];

    let addressStreet =
      fields[prefix + 'AddressNumber'] && fields[prefix + 'AddressStreet']
        ? `${fields[prefix + 'AddressNumber']} ${fields[prefix + 'AddressStreet']} ${
            fields[prefix + 'StreetDesignationId'] ? fields[prefix + 'StreetDesignationId'] : ''
          }`
        : fields[prefix + 'Address']
        ? fields[prefix + 'Address']
        : '';
    const addressUnit = fields[prefix + 'AddressUnit'] ? fields[prefix + 'AddressUnit'] : '';
    addressStreet += addressUnit ? `, Unit ${addressUnit}` : '';

    const is_private = it._index === 'private';
    mapped = {
      id: fields[prefix + 'ListingID'] || '',
      type: fields[prefix + 'PropertyType'] || '',
      agents: agents,
      offices: offices,
      date: fields[prefix + 'ListingDate'] || 0,
      price: fields[prefix + 'AskingPrice'] || 0,
      currency: 'USD',
      image: fields[prefix + 'photos'],

      photos: fields[prefix + 'photos'] || [],
      agent: agent,
      status: fields[prefix + 'Status'] || PropertyStatus.ACTIVE_INDEX,
      lot_size: fields['L_LotSize_SqMtrs'],

      lat: fields[prefix + 'lat'] || 0,
      lng: fields[prefix + 'lng'] || 0,
      street: addressStreet,
      city: fields[prefix + 'City'] || '',
      province_state: fields[prefix + 'Province_State'] || '',
      area: fields[prefix + 'Area'] || '',
      neighborhood: fields[prefix + 'L_SubareaCommunity'] || '',

      bedrooms: fields[prefix + 'L_BedroomTotal'] || '',
      bathrooms: fields[prefix + 'L_TotalBaths'] || '',
      floorArea: fields['L_FloorArea_GrantTotal'],
      area_units: 'Sqft',
      sqft: fields['L_FloorArea_GrantTotal'] + ' ' + 'Sqft',
      built: fields[prefix + 'L_YearBuilt'] || '',

      is_private,
    };
    // mapped.photos = Array.isArray(mapped.photos) ? mapped.photos : mapped.photos.split(',');
  }
  return mapped;
}

export const mapStrAddress = (fields: MLSProperty) => {
  const prefix = '';
  let addressStreet =
    fields[prefix + 'AddressNumber'] && fields[prefix + 'AddressStreet']
      ? `${fields[prefix + 'AddressNumber']} ${fields[prefix + 'AddressStreet']} ${
          fields[prefix + 'StreetDesignationId'] ? fields[prefix + 'StreetDesignationId'] : ''
        }`
      : fields[prefix + 'Address']
      ? fields[prefix + 'Address']
      : '';
  const addressUnit = fields[prefix + 'AddressUnit'] ? fields[prefix + 'AddressUnit'] : '';
  addressStreet += addressUnit ? `, Unit ${addressUnit}` : '';

  return addressStreet;
};
