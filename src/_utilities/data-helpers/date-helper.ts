export function dateStringToDMY(input: string) {
  const dt = new Date(input);
  return [dt.getDate(), dt.getMonth() + 1, dt.getFullYear()].join('/');
}

export function convertDateStringToDateObject(dateString: string): Date {
  if (dateString.split('-').length === 3) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  let dateParts = dateString.split('/');

  let day = Number(dateParts[0]);
  let month = Number(dateParts[1]) - 1;
  let year = Number(dateParts[2]);

  return new Date(year, month, day);
}
