import { CustomerDataModel, LogInResponse } from '@/_typings/customer';
import { ErrorModel } from '@/_typings/error-model';
import { AxiosResponse } from 'axios';

/**
 * Check for API errors
 * @returns string
 */
export function checkForErrors(response: AxiosResponse<{ errors?: ErrorModel[] }>): string {
  let api_error = '';
  if (response.data.errors) {
    response.data.errors.forEach(({ message, extensions }) => {
      if (extensions) {
        if (extensions.error?.details?.errors) {
          extensions.error?.details?.errors.forEach(({ path, message }) => {
            if (path.includes('email')) {
              api_error = `${api_error}Email is either invalid or already taken\n`;
            } else {
              api_error = `${api_error}${message}\n`;
            }
          });
        } else if (extensions.error?.message) {
          api_error = `${extensions.error.message}\n`;
        } else if (message) {
          api_error = `${message}\n`;
        }
      }
    });
  }

  return api_error;
}

/**
 * Check API response and return record if successful otherwise and error message
 * @returns
 */
export function checkLogInResponse(response: AxiosResponse<LogInResponse>): {
  data?: CustomerDataModel;
  error?: string;
} {
  let api_error = checkForErrors(response);

  if (!api_error) {
    const {
      customers: {
        data: [record],
      },
    } = response.data.data;
    if (record) {
      return { data: record };
    }
  }

  return { error: api_error };
}

/**
 * Create a random string with specified length
 * @param length
 * @returns
 */
export function randomString(length = 40) {
  const arr = new Uint8Array(length / 2);
  if (typeof window === 'object' && window.crypto) {
    window.crypto.getRandomValues(arr);
  }
  return Array.from(arr, dec => dec.toString(16).padStart(2, '0')).join('');
}
