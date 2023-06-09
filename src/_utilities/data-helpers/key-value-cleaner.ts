export function getCleanObject(input: unknown, remove_keys: string[] = ['clicked']) {
  const output = input as { [key: string]: unknown };
  Object.keys(output)
    .filter(key => output[key] === undefined || remove_keys.includes(key))
    .forEach(key => {
      delete output[key];
    });
  return output;
}
