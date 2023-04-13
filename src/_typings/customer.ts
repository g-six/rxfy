import { BaseUser } from './base-user';
import { ErrorModel } from './error-model';

export interface Customer extends BaseUser {
  full_name: string;
  encrypted_password: string;
  password?: string;
  yes_to_marketing?: boolean;
  search_url?: string;
  agents: {
    id: number;
  }[];
}

export interface CustomerBySearch extends BaseUser {
  search_url: string;
}

export interface CustomerDataModel {
  id: number;
  attributes: Customer;
}

export interface CustomerInputModel {
  email?: string;
  full_name?: string;
  phone_number?: string;
  encrypted_password?: string;
  password?: string;
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
