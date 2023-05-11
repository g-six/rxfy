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
