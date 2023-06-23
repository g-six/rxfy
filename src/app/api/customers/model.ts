import { CustomerInputModel } from '@/_typings/customer';
import axios, { AxiosError } from 'axios';

const mutation_create_customer = `mutation CreateCustomers($data: CustomerInput!) {
    customer: createCustomer(data: $data) {
      record: data {
        id
        attributes {
            full_name
            first_name
            last_name
            email
            phone_number
            birthday
            last_activity_at
        }
      }
    }
}`;
const mutation_create_agents_customer = `mutation CreateCustomers($data: AgentsCustomerInput!) {
    customer: createAgentsCustomer(data: $data) {
      record: data {
        id
        attributes {
            customer {
                data {
                    id
                    attributes {
                        full_name
                        first_name
                        last_name
                        email
                        phone_number
                        birthday
                    }
                }
            }
        }
      }
    }
}`;

export async function createCustomer(customer: CustomerInputModel, agent: number) {
  try {
    const { data: response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: mutation_create_customer,
        variables: {
          data: customer,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    let customer_id = 0;
    let customer_data;
    if (response.data?.customer?.record) {
      const { id, attributes } = response.data.customer.record;
      customer_data = attributes;
      customer_id = Number(id);
    }
    if (customer_id) {
      const { id: agents_customer_id } = await createAgentCustomer(agent, customer_id);
      return {
        ...customer_data,
        id: customer_id,
        agents_customer_id,
      };
    } else {
      const { errors } = response as {
        errors: { message: string }[];
      };
      if (errors)
        return {
          ...errors,
        };
      return response;
    }
  } catch (e) {
    const { response } = e as AxiosError;
    return response?.data;
  }
}

export async function createAgentCustomer(agent: number, customer: number) {
  const { data: response } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: mutation_create_agents_customer,
      variables: {
        data: {
          agent,
          customer,
          status: 'lead',
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

  if (response.data?.customer?.record) {
    const { id, attributes } = response.data.customer.record;
    const customer = attributes.customer.data.attributes;
    return {
      ...customer,
      id: Number(id),
    };
  }
}
