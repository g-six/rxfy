import { cookies, headers } from 'next/headers';

export function displayConsoleHeader(page: {
  params: { [k: string]: string };
  searchParams: {
    [k: string]: string;
  };
}) {
  const source_html_url = headers().get('x-url') || '';
  const session_key = cookies().get('session_key')?.value || '';
  console.log('');
  console.log('+-------------------------------------');
  console.log('| app/my-listings/page');
  console.log('| source:', source_html_url);
  console.log('+-------------------------------------\n|');
  console.log('| Session:', session_key);
  console.log('|', JSON.stringify(page, null, 2).split('\n').join('\n| '));
  console.log('|\n+-------------------------------------');
}
