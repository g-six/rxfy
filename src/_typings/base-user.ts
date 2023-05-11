export interface BaseUser {
  email: string;
}

export interface UserInputModel {
  email?: string;
  full_name?: string;
  phone_number?: string;
  encrypted_password?: string;
  password?: string;
}
