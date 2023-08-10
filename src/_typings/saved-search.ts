import { DwellingType } from './property';
import { ValueInterface } from './ui-types';

export interface SavedSearchBaseModel {
  beds?: number;
  baths?: number;
  minprice?: number;
  maxprice?: number;
  minsqft?: number;
  maxsqft?: number;
  lat?: number;
  lng?: number;
  nelat?: number;
  nelng?: number;
  swlat?: number;
  swlng?: number;
  zoom?: number;
  type?: 'R';
  sorting?: string;
  types?: string;
  add_date?: number;
  year_built?: number;
  tags?: string;
  area?: string;
  city?: string;
}

export interface SavedSearchInput extends SavedSearchBaseModel {
  id?: number;
  dwelling_types?: string[];
  dwelling_type_ids?: number[];
}
export interface SavedSearchOutput extends SavedSearchBaseModel {
  id: number;
  dwelling_types?: {
    data: {
      attributes: {
        name: DwellingType;
      };
    }[];
  };
}

export interface CustomerSavedSearch extends SavedSearchInput {
  customer: number;
  is_active: boolean;
  last_email_at?: string;
}
export interface SavedSearch extends SavedSearchBaseModel {
  id: number;
  is_active: boolean;
  dwelling_types?: string[];
}
