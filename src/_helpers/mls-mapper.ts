import { BathroomDetails, MLSProperty, PropertyDataModel, RoomDetails } from '@/_typings/property';
import { PrivateListingData } from '@/_typings/events';
import { ImagePreview } from '@/hooks/useFormEvent';
import { LISTING_DATE_FIELDS, isNumericValue } from '@/_utilities/data-helpers/listings-helper';

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

export function convertPropertyDataToPrivateListing(prop: PropertyDataModel, photos: ImagePreview[]): PrivateListingData {
  return {
    id: parseInt(prop.mls_id),
    title: prop.title,
    prompt: prop.description,
    asking_price: prop.asking_price.toString(),
    floor_area_total: prop?.floor_area_total,
    year_built: prop?.year_built,
    status: prop?.status,
    // property_type: { id: , name: prop.property_type },
    state_province: prop.state_province,
    city: prop.city,
    region: prop.region,
    postal_zip_code: prop.postal_zip_code,
    lat: prop.lat,
    lon: prop.lon,
    photos: photos,
    gross_taxes: prop?.gross_taxes ? prop.gross_taxes.toString() : '',
    tax_year: prop?.tax_year ? prop.tax_year.toString() : '',
    beds: prop.beds,
    baths: prop.baths,
  };
}
export function convertPrivateListingToPropertyData(prop: PrivateListingData): any {
  const photos = prop?.photos ? prop?.photos : [];
  const cdnPhotos = photos.map(photo => photo.preview);
  let updates = prop as unknown as {
    [key: string]: unknown;
  };
  Object.keys(updates).forEach(field_name => {
    if (isNumericValue(field_name)) {
      const cleaned = `${updates[field_name]}`.replace(/[^0-9.]/g, '').split('.')[0];
      updates[field_name] = Number(cleaned);
    } else if (LISTING_DATE_FIELDS.includes(field_name)) {
      updates[field_name] = new Date(updates[field_name] as number).toISOString().substring(0, 10); // YYYY-MM-DD
    } else if (Array.isArray(updates[field_name])) {
      const relationships = updates[field_name] as unknown as {
        id: number;
      }[];
      const ids = updates[field_name] as unknown as number[];
      if (typeof ids[0] === 'object') {
        updates[field_name] = relationships.map(({ id }) => id);
      }
    }
  });
  return updates;
}

export const convertToDetails = (data: any, keys: string[]) => {
  let room_details: any[] = [];
  for (let i = 0; i < keys?.length; i++) {
    const currItem: any = data[keys[i]];

    if (currItem && currItem?.length > 0) {
      currItem.forEach((item: any) => {
        room_details.push({ ...item, type: keys[i] });
      });
    }
  }
  return { room_details };
};
export const convertToRooms = (details: any) => {
  const dataToUpdate: any = {};
  if (details && details?.length > 0) {
    details.forEach((item: any) => {
      if (item.type) {
        dataToUpdate[item.type] = [...(dataToUpdate[item.type] ?? []), { ...item }];
      }
    });
  }
  return dataToUpdate;
};

const MAX_NUM_OF_ROOMS = 50;
export function roomsToRoomDetails(mls_data: MLSProperty) {
  const rooms: RoomDetails[] = [];
  for (let num = 1; num <= MAX_NUM_OF_ROOMS; num++) {
    if (mls_data[`L_Room${num}_Type`]) {
      rooms.push({
        type: (mls_data[`L_Room${num}_Type`] as string) || '',
        length: (mls_data[`L_Room${num}_Dimension1`] as string) || '',
        width: (mls_data[`L_Room${num}_Dimension2`] as string) || '',
        level: (mls_data[`L_Room${num}_Level`] as string) || '',
      });
    }
  }
  if (mls_data.L_MainLevelBedrooms) {
    for (let num = 1; num <= Number(mls_data.L_MainLevelBedrooms); num++) {
      rooms.push({
        type: 'Bedroom',
        length: '',
        width: '',
        level: 'Main',
      });
    }
  }
  if (mls_data.L_MainLevelKitchens) {
    for (let num = 1; num <= Number(mls_data.L_MainLevelKitchens); num++) {
      rooms.push({
        type: 'Kitchen',
        length: '',
        width: '',
        level: 'Main',
      });
    }
  }
  if (mls_data.L_MainLevelKitchens) {
    for (let num = 1; num <= Number(mls_data.L_MainLevelKitchens); num++) {
      rooms.push({
        type: 'Kitchen',
        length: '',
        width: '',
        level: 'Main',
      });
    }
  }
  ['Second', 'Third', 'Fourth'].forEach(lvl => {
    if (mls_data[`L_BedroomsCount${lvl}Level`]) {
      for (let num = 1; num <= Number(mls_data[`L_BedroomsCount${lvl}Level`]); num++) {
        rooms.push({
          type: 'Bedroom',
          length: '',
          width: '',
          level: `${lvl} Level`,
        });
      }
    }
    if (mls_data[`L_Kitchens${lvl}Level`]) {
      for (let num = 1; num <= Number(mls_data[`L_Kitchens${lvl}Level`]); num++) {
        rooms.push({
          type: 'Kitchen',
          length: '',
          width: '',
          level: `${lvl} Level`,
        });
      }
    }
  });

  return { rooms };
}
export function bathroomsToBathroomDetails(mls_data: MLSProperty) {
  const baths: BathroomDetails[] = [];
  for (let num = 1; num <= MAX_NUM_OF_ROOMS; num++) {
    if (mls_data[`L_Bath${num}_Pcs`]) {
      const ensuite = (mls_data[`L_Bath${num}_Ensuite`] as string) || 'No';
      baths.push({
        ensuite,
        pieces: (mls_data[ensuite === 'No' ? `L_Bath${num}_Pcs` : 'L_BathEnsuite_Pcs'] as number) || (mls_data[`L_Bath${num}_Pcs`] as number) || 1,
        level: (mls_data[`L_Room${num}_Level`] as string) || '',
      });
    }
  }
  if (mls_data.L_MainLevelBathrooms) {
    for (let num = 1; num <= Number(mls_data.L_MainLevelBathrooms); num++) {
      baths.push({
        level: 'Main',
      });
    }
  }
  if (mls_data.L_BathroomsCountLowerLevel) {
    for (let num = 1; num <= Number(mls_data.L_BathroomsCountLowerLevel); num++) {
      baths.push({
        level: 'Lower Level',
      });
    }
  }

  return { baths };
}
