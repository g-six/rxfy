export interface ApartmentCondoInput {
  name: string;
  property: number;
  lat: number;
  lng: number;
  address: string;
  postal_zip_code: string;
  state_province: string;
  country: string;
  mls_id: string;
  mapbox_id: string;
}

export interface ApartmentCondoRecord {
  data: {
    id: number;
    attributes: ApartmentCondoInput;
  };
}
