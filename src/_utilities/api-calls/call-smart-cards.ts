import { SmartCardInput } from '@/_typings/smart-cards';
import axios from 'axios';
import Cookies from 'js-cookie';
import { getUploadUrl } from './call-uploader';
import { sendTemplate } from '@/app/api/send-template';

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

export async function emailSmartCard(id: number, attachments: unknown[], { email, name, phone }: { email: string; name: string; phone: string }) {
  const session_key = Cookies.get('session_key');

  if (!session_key) return { error: 'You need to be logged in' };

  if (attachments && attachments.length) {
    let [, random_key] = `${Math.random()}`.split('.');
    random_key =
      (((session_key.split('-').pop() as string) + '-' + new Date().toISOString().split('T').reverse().pop()) as string) +
      '-' +
      random_key.substring(5, 8) +
      '-' +
      random_key.substring(8);
    let front_url = '',
      back_url = '';

    await (attachments as File[]).map(async (attachment: File, idx) => {
      const { upload_url, url } = await getUploadUrl(`realtors/${session_key.split('-')[1]}/smart-cards/${random_key}/${attachment.name}`, attachment);
      const { content } = attachment as unknown as {
        content: string;
      };
      let blob = await fetch(content).then(r => r.blob());
      await axios.put(upload_url, new File([blob], attachment.name, { type: attachment.type }), { headers: { 'Content-Type': attachment.type } });
      if (idx === 0) front_url = url;
      else back_url = url;
      console.log({
        id,
        url,
        front_url,
        back_url,
      });
    });

    if (front_url || back_url) {
      const results = await axios.put(
        `/api/smart-cards/${id}`,
        {
          front_url,
          back_url,
        },
        HEADERS,
      );

      // await sendTemplate(
      //   'new-card-order',
      //   [
      //     {
      //       name: 'Smart Cards',
      //       email: 'team+smartcards@leagent.com',
      //     },
      //   ],
      //   {
      //     name,
      //     customer_email: email,
      //     customer_name: name,
      //     customer_phone: phone,
      //   },
      //   attachments,
      // );

      return results.data;
    }
  }
}
