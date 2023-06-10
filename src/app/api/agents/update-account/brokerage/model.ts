import { BrokerageInput } from '@/_typings/brokerage';
import { formatAddress, toKebabCase } from '@/_utilities/string-helper';
import axios from 'axios';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

export const GQ_FRAG_BROKERAGE = `record: data {
    id
    attributes {
      name
      full_address
      phone_number
      website_url
      logo_url
      lat
      lon
    }
}`;
const gql_create = `mutation CreateBrokerage($data: BrokerageInput!) {
  brokerage: createBrokerage(data: $data) {
    ${GQ_FRAG_BROKERAGE}
  }
}`;
const gql_update = `mutation UpdateBrokerage($id: ID!, $data: BrokerageInput!) {
  brokerage: updateBrokerage(id: $id, data: $data) {
    ${GQ_FRAG_BROKERAGE}
  }
}`;

export async function createOrUpdateBrokerage(realtor_id: number, input: BrokerageInput) {
  const { id, clicked, ...data } = input as unknown as { [key: string]: unknown };
  const results = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: id ? gql_update : gql_create,
      variables: {
        id,
        data: {
          ...data,
          slug: id ? undefined : toKebabCase(realtor_id + ' ' + data.name),
          realtors: id ? undefined : [realtor_id],
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (results.data.data.brokerage)
    return {
      ...results.data.data.brokerage.record.attributes,
      id: Number(results.data.data.brokerage.record.id),
    };
  else {
    if (results.data?.errors) {
      const [error] = results.data.errors.map((error: { extensions: { error: { details: { errors: { path: string[]; message: string }[] } } } }) => {
        const { message } = error.extensions.error.details.errors[0];
        if (message && message.indexOf('must be unique')) {
          return 'You have already created this brokerage record';
        }
      });
      return {
        error,
      };
    }
    throw {
      response: results,
    };
  }
}
