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

  // First, check separator
  let cleaned: string = '';
  if (input.indexOf('-') > 0) {
    const portions = input.split('-');
    if (portions.length < 3) {
      return input;
    }
    portions.forEach((p, i) => {
      if (i < 2) {
        if (p.length > 2) return input;
        if (p.length < 2) {
          cleaned = `${cleaned}0${p}`;
        } else {
          cleaned = `${cleaned}${p}`;
        }
      }
      if (i === 2) {
        if (p.length > 4) return input;
        if (p.length < 4) {
          cleaned = `${cleaned}19${p.substring(0, 2)}`;
        } else {
          cleaned = `${cleaned}${p}`;
        }
      }
    });
  } else {
    cleaned = input;
  }

  // Second, remove all non numeric values
  cleaned = cleaned.replace(/\D/g, '');

  if (cleaned.length < 8) return cleaned;

  // Next, split into groups e.g. (day) (month) (last 4 digits as year)
  const grouped: RegExpMatchArray | null = cleaned.match(/(\d{0,2})(\d{0,2})(\d{0,4})/);
  if (grouped && grouped.length < 4) {
    grouped.push('1999');
  }
  // If unable to format the input, just return as is
  if (grouped === null) return input;

  return !grouped[2] ? grouped[1] : grouped[1] + '/' + grouped[2] + (grouped[3] ? '/' + grouped[3] : '');
}

export function validateEmail(email: string) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
