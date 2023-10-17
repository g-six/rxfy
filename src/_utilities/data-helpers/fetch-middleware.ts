import axios from 'axios';
import { cache } from 'react';

export const revalidate = 3600;
export const getHTMLPage = cache(async (url: string) => {
  const item = await axios.get(url);
  return item.data;
});
