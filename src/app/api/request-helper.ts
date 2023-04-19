import axios from 'axios';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { DataModel } from '@/_typings/data-models';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

export function extractBearerFromHeader(header?: string) {
  if (!header) return;

  const [auth_type, token] = header.split(' ');
  if (!auth_type || !token) return;

  switch (capitalizeFirstLetter(auth_type)) {
    case 'Bearer':
      return token;
    default:
      return;
  }
}

export async function gqlRequest(query: string, variables: { [record: string]: string | number | boolean }) {
  return await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query,
      variables,
    },
    {
      headers,
    },
  );
}

const getGql = (model: DataModel, user_model: 'agent' | 'customer') => `query Ownership($id: ID!) {
  ${model}(id: $id) {
    data {
      id
      attributes {
        user: ${user_model} {
          data {
            id
          }
        }
      }
    }
  }
}`;
export async function getRecordOwnerId(model: DataModel, record_id: number, user_model: 'agent' | 'customer'): Promise<number> {
  const res = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: getGql(model, user_model),
      variables: {
        id: record_id,
      },
    },
    {
      headers,
    },
  );
  const { data } = res.data;

  return Number(data[model].data.attributes.user.data.id);
}
