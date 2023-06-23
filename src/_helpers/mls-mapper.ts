import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { PrivateListingData } from '@/_typings/events';
import { ImagePreview } from '@/hooks/useFormEvent';

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
    // property_type: { id: , name: prop.property_type },
    state_province: prop.state_province,
    city: prop.city,
    region: prop.region,
    postal_zip_code: prop.postal_zip_code,
    lat: prop.lat,
    lon: prop.lon,
    photos: photos,
    property_tax: prop?.gross_taxes ? prop.gross_taxes.toString() : '',
    tax_year: prop?.tax_year ? prop.tax_year.toString() : '',
    beds: prop.beds,
    baths: prop.baths,
  };
}

export function convertPrivateListingToPropertyData(prop: PrivateListingData): any {
  const photos = prop?.photos ? prop?.photos : [];
  const cdnPhotos = photos.map(photo => photo.preview);
  return {
    //TAB AI
    // mls_id: prop?.id?.toString() ?? '',
    title: prop?.title ?? '',
    description: prop?.prompt,
    photos: cdnPhotos ? cdnPhotos : [],
    //TAB ADDRESS
    state_province: prop.state_province,
    city: prop?.city ?? '',
    building_unit: prop?.building_unit,
    region: prop?.region ?? '',
    postal_zip_code: prop.postal_zip_code,
    lat: prop.lat,
    lon: prop.lon,
    // area: prop?.living_area?.toString() ?? '', ----- WHAT INPUT IS RESPONSIBLE FOR IT
    //TAB SUMMARY
    dwelling_type: prop?.dwelling_type?.id,
    asking_price: prop?.asking_price ? parseInt(prop.asking_price) : 0,
    //building_style: prop?.building_style?.id, ---- MISSING IN PRIVATE LISTINGS MODEL
    year_built: prop?.year_built,
    property_disclosure: prop?.property_disclosure,
    gross_taxes: prop?.property_tax ? parseFloat(prop.property_tax) : 0,
    tax_year: prop?.tax_year ? parseInt(prop.tax_year) : 0,
    amenities: prop?.amenities?.map(it => it.id),
    connected_services: prop?.connected_services?.map(it => it.id),
    //TAB SIZE
    floor_area_total: prop?.floor_area_total,
    floor_area_uom: prop?.floor_area_uom === 'sqm' ? 'Metres' : 'Feet',
    lot_area: prop?.lot_area,
    lot_uom: prop?.lot_uom,
    beds: prop.beds,
    baths: prop.baths,
    full_baths: prop?.full_baths ?? prop?.baths,
    half_baths: prop?.half_baths,
    ///  TAB SIZE MISSING A LOT OF STUFF ON PRIVATE LISTINGS : MISMATCHES WITH TYPES ETC...

    // TAB STRATA
    building_bylaws: prop?.building_bylaws,
    strata_fee: prop?.strata_fee,
    restrictions: prop?.restrictions,
    minimum_age_restriction: prop?.minimum_age_restriction,
    total_dogs_allowed: prop?.total_dogs_allowed,
    total_cats_allowed: prop?.total_cats_allowed,
    total_pets_allowed: (prop?.total_dogs_allowed ?? 0) + (prop?.total_cats_allowed ?? 0),
    total_allowed_rentals: prop?.total_allowed_rentals,
    complex_compound_name: prop?.complex_compound_name,
    council_approval_required: prop?.council_approval_required,
  };
}
