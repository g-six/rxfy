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
    living_area: parseInt(prop.area),
    built_year: prop?.year_built?.toString() ?? '',
    property_type: { value: prop.property_type, label: prop.property_type },
    state: prop.state_province,
    city: prop.city,
    neighbourhood: prop.region,
    zip: prop.postal_zip_code,
    lat: prop.lat,
    lon: prop.lon,
    photos: photos,
    property_tax: prop?.gross_taxes ? prop.gross_taxes.toString() : '',
    tax_year: prop?.tax_year ? prop.tax_year.toString() : '',
    beds: prop.beds,
    baths: prop.baths,
  };
}

export function convertPrivateListingToPropertyData(prop: PrivateListingData): PropertyDataModel {
  const photos = prop?.photos ? prop?.photos : [];
  const cdnPhotos = photos.map(photo => photo.preview);
  return {
    mls_id: prop?.id?.toString() ?? '',
    title: prop?.title ?? '',
    description: prop.prompt,
    asking_price: prop?.asking_price ? parseInt(prop.asking_price) : 0,
    area: prop?.living_area?.toString() ?? '',
    year_built: prop?.built_year ? parseInt(prop.built_year) : 0,
    property_type: prop?.property_type?.value ? prop.property_type.value.toString() : '',
    state_province: prop.state,
    city: prop?.city ?? '',
    region: prop?.neighbourhood ?? '',
    postal_zip_code: prop.zip,
    lat: prop.lat,
    lon: prop.lon,
    photos: cdnPhotos ? cdnPhotos : [],
    gross_taxes: prop?.property_tax ? parseFloat(prop.property_tax) : 0,
    tax_year: prop?.tax_year ? parseInt(prop.tax_year) : 0,
    beds: prop.beds,
    baths: prop.baths,
  };
}
