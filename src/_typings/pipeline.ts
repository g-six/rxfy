export interface Hit {
  _index: string;
  _id: number;
  _source: unknown;
  fields: Record<string, unknown>;
}

export interface LegacySearchPayload {
  from: number;
  size: number;
  sort?:
    | {
        [key: string]: 'asc' | 'desc';
      }
    | {
        [key: string]: 'asc' | 'desc' | Record<string, unknown>;
      }[];
  fields?: string[];
  query: {
    terms?: {
      [k: string]: string[];
    };
    bool: {
      filter?: {
        match?: Record<string, string | number>;
        term?: { [k: string]: string };
        range?: {};
      }[];
      should?: {
        match?: Record<string, string | number>;
        range?: {};
      }[];
      minimum_should_match?: number;
      must_not?: {
        match?: Record<string, string | number>;
        range?: {};
      }[];
      must?: {
        match?: Record<string, string | number>;
        exists?: {
          field: string;
        };
        term?: Record<string, string | number>;
        range?: {};
      }[];
    };
  };
  _source?: boolean;
}

export interface PropertyIndexNode {
  lat: number;
  lng: number;
  AskingPrice: number;
  Address: string;
  City: string;
  Province_State: string;
  PostalCode_Zip: string;
  Area: string;
  Status: string[];
  L_BedroomTotal: number;
  L_ComplexName?: string;
  PropertyType?: string;
  L_FloorArea_Main?: number;
  L_KitchensTotal?: number;
  L_LotSize_SqFt?: number;
  L_FullBaths?: number;
  L_HalfBaths?: number;
  L_TotalBaths: number;
  L_FloorArea_GrantTotal: number;
  L_YearBuilt?: number;
  ListingID?: string;
  MLS_ID: string | number;
  photos: string[];
  center?: {
    lon: number;
    lat: number;
  };
}
