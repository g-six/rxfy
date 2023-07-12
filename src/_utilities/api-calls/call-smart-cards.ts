import { SmartCardInput } from '@/_typings/smart-cards';
import axios from 'axios';
import Cookies from 'js-cookie';
import { getUploadUrl } from './call-uploader';

const HEADERS = {
  headers: {
    Authorization: `Bearer ${Cookies.get('session_key')}`,
  },
};

export async function getSmartCards() {
  const results = await axios.get('/api/smart-cards', HEADERS);

  return results.data;
}

export async function createSmartCard(input: SmartCardInput) {
  let logo_url;
  const { logo, ...record } = input;
  const session_key = Cookies.get('session_key');
  if (!session_key) return { error: 'You need to be logged in' };
  if (logo) {
    let [, random_key] = `${Math.random()}`.split('.');
    random_key = random_key.substring(0, 5) + '-' + random_key.substring(5, 8) + '-' + random_key.substring(8);
    const { upload_url, url } = await getUploadUrl(`realtors/${session_key.split('-')[1]}/smart-cards/${random_key}-${logo.name}`, logo);
    await axios.put(upload_url, logo, { headers: { 'Content-Type': logo.type } });
    logo_url = url;
  }

  const results = await axios.post(
    '/api/smart-cards',
    {
      ...record,
      logo_url,
    },
    HEADERS,
  );

  return results.data;
}

export async function deleteSmartCard(id: number) {
  const results = await axios.delete(`/api/smart-cards/${id}`, HEADERS);

  return results.data;
}

export async function emailSmartCard(...params: any[]) {
  console.log({ params });
}
