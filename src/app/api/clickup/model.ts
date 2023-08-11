import axios from 'axios';
import { NextRequest } from 'next/server';

const { NEXT_APP_CLICKUP_ENDPOINT, NEXT_APP_CLICKUP_TOKEN, NEXT_APP_CLICKUP_CUSTOMER_REQUEST_LIST } = process.env as unknown as {
  [K: string]: string;
};
export async function createTask(title: string, description: string) {
  return await axios.post(
    `${NEXT_APP_CLICKUP_ENDPOINT}/list/${NEXT_APP_CLICKUP_CUSTOMER_REQUEST_LIST}/task`,
    {
      name: title,
      description,
    },
    {
      headers: {
        Authorization: NEXT_APP_CLICKUP_TOKEN,
        'Content-Type': 'application/json',
      },
    },
  );
}
