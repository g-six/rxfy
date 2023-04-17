export function repeatChar(character: string, num_of_times: number) {
  if (num_of_times === 0) {
    return;
  }
  let output = '';
  for (let i = 0; i < num_of_times; i++) {
    output += character;
  }

  return output;
}
