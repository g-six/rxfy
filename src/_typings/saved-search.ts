import { DwellingType } from './property';

export interface SavedSearchInput {
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
  dwelling_types?: DwellingType[];
  types?: string;
  add_date?: number;
  build_year?: number;
  tags?: string;
  city?: string;
}

export interface CustomerSavedSearch extends SavedSearchInput {
  customer: number;
  is_active: boolean;
  last_email_at?: string;
}
export interface SavedSearch extends CustomerSavedSearch {
  id: number;
}
