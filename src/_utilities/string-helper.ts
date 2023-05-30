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

export function toKebabCase(input_string: string) {
  const kebab_string = input_string.replace(/[^a-z0-9]/gi, '-');
  const kebab_string_words = kebab_string.split('-');

  let result_string = '';

  kebab_string_words.forEach(word => {
    if (word.toLowerCase()) {
      result_string = result_string + word.toLowerCase() + ' ';
    }
  });

  const final_string = result_string.trim().split(' ').join('-');

  return final_string;
}

export function emailToSlug(email: string): string {
  // Split the email address into an array of strings
  const emailArray = email.split('@');
  const slugs: string[] = [];
  // Loop through the array of strings and replace all non-slug characters with a hyphen
  emailArray.forEach((str: string) => {
    slugs.push(str.replace(/[^a-z0-9]/gi, '-').toLowerCase());
  });
  // Return the slug
  return slugs.join('-');
}

export function formatAddress(input: string): string {
  // split the input string by the blank space
  const address = input.split(' ');

  // use array mapping method to create the output
  const output = address
    .map(word => {
      // If word is longer than two characters, capitalize only the first letter
      return (word.length > 2 && isNaN(Number(word.split('').pop())) && isNaN(Number(word.charAt(0)))) || street_roads_etc.includes(word.toUpperCase())
        ? word[0].toUpperCase() + word.slice(1).toLowerCase()
        : // If word is two characters or shorter OR in form of 143A, keep it as is
          word;
    })
    .join(' ');

  return output;
}

const street_roads_etc = ['ST', 'RD', 'CRES', 'AVE', 'BLV', 'BLVD'];
