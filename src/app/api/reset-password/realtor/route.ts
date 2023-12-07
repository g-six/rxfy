import { encrypt } from '@/_utilities/encryption-helper';
import { MessageRecipient } from '@mailchimp/mailchimp_transactional';
import axios from 'axios';
import { sendTemplate } from '../../send-template';
import { headers } from 'next/headers';
import { consoler } from '@/_helpers/consoler';

const gql = `query GetUserId ($email: String!) {
  realtors(filters: { email: { eqi: $email } }) {
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
  realtor: updateRealtor(id: $id, data: { last_activity_at: $timestamp }) {
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
    const { email } = await request.json();
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

      const [data] = response_data.data?.realtors?.data || [];

      if (data && data.id) {
        const send_to: MessageRecipient[] = [
          {
            email: data.attributes.email,
            name: data.attributes.full_name,
          },
        ];
        const client_url = `${headers().get('x-rx-origin')}/update-password?key=${encrypt(data.attributes.last_activity_at)}.${encrypt(email)}-${data.id}`;
        await sendTemplate('forgot-password', send_to, {
          subject: 'Leagent Password Recovery',
          client_url,
        });

        return new Response(
          JSON.stringify(
            {
              message: 'We have sent you an email',
              last_activity_at: data.attributes.last_activity_at,
            },
            null,
            4,
          ),
          {
            headers: {
              'content-type': 'application/json',
            },
          },
        );
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
