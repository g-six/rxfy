import { capitalizeFirstLetter } from '@/_utilities/formatters';

export function extractBearerFromHeader(header?: string) {
  if (!header) return;

  const [auth_type, token] = header.split(' ');
  if (!auth_type || !token) return;

  switch (capitalizeFirstLetter(auth_type)) {
    case 'Bearer':
      return token;
    default:
      return;
  }
}
