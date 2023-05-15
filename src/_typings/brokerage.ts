export interface BrokerageInput {
  name: string;
  slug: string;
  phone_number: string;
  full_address: string;
  website_url?: string;
  lat: number;
  lng: number;
}

export interface BrokerageDataModel extends BrokerageInput {
  id: number;
}
