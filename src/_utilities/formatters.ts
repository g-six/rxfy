export function capitalizeFirstLetter(str: string): string {
  let result = str.split(' ');
  for (let i = 0; i < result.length; i++) {
    result[i] = result[i].charAt(0).toUpperCase() + result[i].slice(1);
  }
  return result.join(' ');
}

export function formatPhone(input: string): string {
  if (!input) return '';

  // First, remove all non numeric values
  const cleaned: string = input.replace(/\D/g, '');

  // Next, split into groups e.g. (area code) (first 3 digits) (last 4 digits)
  const grouped: RegExpMatchArray | null = cleaned.match(/(\d{0,3})(\d{0,3})(\d{0,4})/);

  // If unable to format the input, just return as is
  if (grouped === null) return input;

  return !grouped[2] ? grouped[1] : '(' + grouped[1] + ') ' + grouped[2] + (grouped[3] ? '-' + grouped[3] : '');
}

export function formatShortDate(input: string): string {
  if (!input) return '';

  let day, month, year;
  day = input.substring(0, 2);
  month = input.substring(2, 4);
  year = input.substring(4);
  return `${day}/${month}/${year}`;
}

export function validateEmail(email: string) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
