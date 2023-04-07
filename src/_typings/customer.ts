import { BaseUser } from './base-user';
import { ErrorModel } from './error-model';

export interface Customer extends BaseUser {
  full_name: string;
  encrypted_password: string;
  agents: {
    id: number;
  }[];
}

export interface CustomerDataModel {
  id: number;
  attributes: Customer;
}

export type LogInResponse = {
  data: {
    customers: {
      data: CustomerDataModel[];
    };
  };
  errors?: ErrorModel[];
};
