import { SignUpModel } from './_types';

export function validateInput(data: { email?: string; password?: string; full_name?: string; agent?: number }): {
  data?: SignUpModel;
  errors?: {
    email?: string;
    full_name?: string;
    password?: string;
  };
  error?: string;
} {
  let error = '';

  if (!data.email) {
    error = `${error}\nA valid email is required`;
  }
  if (!data.full_name) {
    error = `${error}\nA name to address`;
  }
  if (!data.password) {
    error = `${error}\nA hard-to-guess password with at least 10 characters is required`;
  }

  if (error) {
    return { error };
  }

  return {
    data: {
      ...data,
    } as unknown as SignUpModel,
  };
}
