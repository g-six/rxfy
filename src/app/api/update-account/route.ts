import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { convertDateStringToDateObject } from '@/_utilities/data-helpers/date-helper';
import { encrypt } from '@/_utilities/encryption-helper';
import axios, { AxiosError } from 'axios';
import { getResponse } from '@/app/api/response-helper';
import { getNewSessionKey } from '@/app/api/update-session';

const gql = `query GetUserId ($id: ID!) {
  user: customer(id: $id) {
    data {
      id
      attributes {
        email
        last_activity_at
      }
    }
  }
}`;

const mutation_gql = `mutation UpdateAccount ($id: ID!, $data: CustomerInput!) {
    user: updateCustomer(id: $id, data: $data) {
      record: data {
        id
        attributes {
          email
          full_name
          birthday
          phone_number
          last_activity_at
          yes_to_marketing
        }
      }
    }
}`;

export async function PUT(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  const { email, full_name, phone_number, birthday, password } = await request.json();
  try {
    if (!token || !guid)
      return getResponse(
        {
          error: 'Please login',
        },
        401,
      );

    let updates: { [key: string]: Date | string | number | boolean } = {
      last_activity_at: new Date().toISOString(),
    };

    const { data: response_data } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql,
        variables: {
          id: guid,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const record = response_data.data?.user?.data?.attributes || {};
    if (!record.email || !record.last_activity_at || `${encrypt(record.last_activity_at)}.${encrypt(record.email)}` !== token) {
      return new Response(
        JSON.stringify(
          {
            error: 'Invalid token or you have been signed out, please login again',
          },
          null,
          4,
        ),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 400,
        },
      );
    } else if (email !== undefined && record.email !== email) {
      updates = {
        ...updates,
        email,
      };
    }

    if (full_name) {
      updates = {
        ...updates,
        full_name,
      };
    }
    if (phone_number) {
      updates = {
        ...updates,
        phone_number,
      };
    }
    if (birthday) {
      updates = {
        ...updates,
        birthday: convertDateStringToDateObject(birthday).toISOString().split('T')[0],
      };
    }

    if (password) {
      updates = {
        ...updates,
        encrypted_password: encrypt(password),
      };
    }

    const last_activity_at = new Date().toISOString();
    updates = {
      ...updates,
      last_activity_at,
    };

    const variables = {
      id: guid,
      data: updates,
    };

    const {
      data: {
        data: { user },
      },
    } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: mutation_gql,
        variables,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return getResponse(
      {
        user: {
          id: guid,
          ...user.record.attributes,
        },
        session_key: `${encrypt(last_activity_at)}.${encrypt(user.record.attributes.email)}-${guid}`,
      },
      200,
    );
  } catch (e) {
    console.log('Error in Update Account API request');
    const errors = e as AxiosError;
    console.log(JSON.stringify(errors.response?.data, null, 4));
    return new Response(
      JSON.stringify(
        {
          error: 'Unable to update your account',
          email,
          full_name,
          phone_number,
          birthday,
        },
        null,
        4,
      ),
      {
        headers: {
          'content-type': 'application/json',
        },
        status: 400,
      },
    );
  }
}
