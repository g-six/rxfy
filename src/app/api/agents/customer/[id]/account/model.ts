import { Customer } from '@/_typings/customer';
import axios from 'axios';

export const gql_update_customer = `mutation UpdateCustomerAccount($id: ID!, $updates: CustomerInput!) {
    updateCustomer(id: $id, data: $updates) {
        record: data {
            id
            attributes {
                full_name
                birthday
                phone_number
                email
            }
        }
    }
}`;

export async function updateAgentCustomerAccount(id: number, updates: Customer) {
  try {
    const { data: response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_update_customer,
        variables: {
          id,
          updates,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (response.errors) {
      const [first_error] = response.errors;
      if (first_error.extensions?.error?.details?.errors) {
        const [detail] = first_error.extensions?.error?.details?.errors;
        if (detail.path.includes('email')) return { field: 'email', error: 'This email is already taken' };
      }
    }
    return {
      ...response.data.updateCustomer.record.attributes,
      id: Number(response.data.updateCustomer.record.id),
    };
  } catch (e) {
    console.error(e);
  }
}
