interface UserDataCore {
  jwt: string;
  is_logged?: string;
  is_expired?: boolean;
  user: {
    id: number;
    email: string;
    expiration_date?: number;
    user_type: string;
  };
  client_profile: {
    id: number;
  };
}
export interface UserData extends UserDataCore {
  data?: {
    login?: UserDataCore;
  };
}

export interface RealtorInput {
  email: string;
  encrypted_password: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  is_verified: boolean;
  last_activity_at: string;
  agent: number;
  stripe_customer: string;
  stripe_subscriptions: {
    [key: string]: {
      [key: string]: string;
    };
  };
}
