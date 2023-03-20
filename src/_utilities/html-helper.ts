export function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

export function hasClassName(input: string, search_for: string) {
  return input.split(' ').includes(search_for);
}
