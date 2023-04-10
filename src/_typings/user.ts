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
