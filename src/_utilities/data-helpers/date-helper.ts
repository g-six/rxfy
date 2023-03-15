export function dateStringToDMY(input: string) {
  const dt = new Date(input);
  return [dt.getDate(), dt.getMonth() + 1, dt.getFullYear()].join(
    '/'
  );
}
