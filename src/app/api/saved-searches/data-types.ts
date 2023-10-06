export interface SavedSearchInput {
  add_date?: number;
  area?: string;
  baths?: number;
  beds?: number;
  city?: string;
  dwelling_types?: {
    data: {
      id: number;
      attributes: {
        name: string;
        code: string;
      };
    }[];
  };
  is_active?: boolean;
  last_email_at?: number;
  lat?: number;
  lng?: number;
  maxprice?: number;
  minprice?: number;
  maxsqft?: number;
  minsqft?: number;
  nelat?: number;
  nelng?: number;
  swlat?: number;
  swlng?: number;
  search_url?: string;
  searsorting?: string;
  tags?: string;
  year_built?: number;
  zoom?: number;
}
export interface SavedSearchGraph {
  id: number;
  attributes: SavedSearchInput;
}
