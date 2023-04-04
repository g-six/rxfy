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
