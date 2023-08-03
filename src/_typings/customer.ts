import { BaseUser, UserInputModel } from './base-user';
import { ErrorModel } from './error-model';
import { SavedSearch } from './saved-search';

export interface Customer extends BaseUser {
  full_name: string;
  encrypted_password: string;
  password?: string;
  yes_to_marketing?: boolean;
  search_url?: string;
  agents: {
    id: number;
  }[];
  saved_searches?: {
    id: number;
    attributes: SavedSearch;
  }[];
}

export interface CustomerRecord {
  id: number;
  agent_customer_id: number;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  status: 'active' | 'lead' | 'closed';
  phone_number?: string;
  birthday?: string;
  last_activity_at?: string;
  notes?: {
    id: number;
    body: string;
    created_at: string;
  }[];
  saved_searches?: {
    id: number;
    city?: string;
    maxprice?: number;
    minprice?: number;
  }[];
}

export interface CustomerBySearch extends BaseUser {
  search_url: string;
}

export interface CustomerDataModel {
  id: number;
  attributes: Customer;
}

export interface CustomerInputModel extends UserInputModel {
  birthday?: string;
  yes_to_marketing?: boolean;
}

export type LogInResponse = {
  data: {
    customers: {
      data: CustomerDataModel[];
    };
  };
  errors?: ErrorModel[];
};
