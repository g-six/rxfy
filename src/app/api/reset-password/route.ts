import { encrypt } from '@/_utilities/encryption-helper';
import { MessageRecipient } from '@mailchimp/mailchimp_transactional';
import axios from 'axios';
import { sendTemplate } from '../send-template';
import { getResponse } from '../response-helper';
import { headers } from 'next/headers';
import { consoler } from '@/_helpers/consoler';
import { getImageSize } from 'next/dist/server/image-optimizer';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

const gql = `query GetUserId ($email: String!) {
  customers(filters: { email: { eqi: $email } }) {
    data {
      id
      attributes {
        email
        last_activity_at
      }
    }
  }
}`;

const mutation_gql = `mutation ResetPassword ($id: ID!, $timestamp: DateTime!) {
  customer: updateCustomer(id: $id, data: { last_activity_at: $timestamp }) {
    data {
      id
      attributes {
        full_name
        email
        last_activity_at
      }
    }
  }
}`;

export async function PUT(request: Request) {
  try {
    const { email, pathway } = await request.json();
    const url = new URL(headers().get('x-referer') || request.url);

    if (email) {
      const { data: response_data } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql,
          variables: {
            email,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const [data] = response_data.data?.customers?.data || [];

      if (data && data.id) {
        const {
          data: {
            data: { customer },
          },
        } = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: mutation_gql,
            variables: {
              id: data.id,
              timestamp: data.attributes.last_activity_at || new Date().toISOString(),
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const send_to: MessageRecipient[] = [
          {
            email: customer.data.attributes.email,
            name: customer.data.attributes.full_name,
          },
        ];
        const session_key = `${encrypt(customer.data.attributes.last_activity_at)}.${encrypt(email)}-${customer.data.id}`;
        const client_url = `${request.headers.get('x-rx-origin')}${pathway ? `/${pathway}` : ''}/update-password?key=${session_key}`;
        const logo_url = headers().get('x-light-bg-logo') || headers().get('x-dark-bg-logo') || '';
        let agent_logo: string = 'https://leagent.com/logo-dark.svg';

        if (logo_url) {
          let extension = logo_url.split('.').pop() || '';
          const logo = await fetch(logo_url);
          const logo_buff = await logo.arrayBuffer();
          const { width, height } = await getImageSize(Buffer.from(logo_buff), extension.toLowerCase() as unknown as 'jpeg' | 'png');
          if (height && width && height > width) {
            agent_logo = getImageSized(logo_url, width > 100 ? 100 : width);
          } else if (width) {
            agent_logo = getImageSized(logo_url, width > 240 ? 240 : width);
          }
        }

        await sendTemplate('forgot-password', send_to, {
          subject: 'Leagent Password Recovery',
          client_url,
          agent_logo,
        });
        return getResponse({
          message: 'If we have a matching record (correct email), we will be emailing you the reset link.',
          last_activity_at: customer.data.attributes.last_activity_at,
        });
      } else {
        return getResponse({
          message: 'If we have a matching record (correct email), we will be emailing you the reset link.',
        });
      }
    }
  } catch (e) {
    console.log('Error in Reset Password API request');
    // console.log(e);
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Please enter your email',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 400,
      statusText: 'Please enter your email',
    },
  );
}
