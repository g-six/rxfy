import { CustomerInputModel } from '@/_typings/customer';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import axios, { AxiosError } from 'axios';

const customer_attributes = `{
            full_name
            first_name
            last_name
            email
            phone_number
            birthday
            last_activity_at
        }
`;
const mutation_create_customer = `mutation CreateCustomers($data: CustomerInput!) {
    customer: createCustomer(data: $data) {
      record: data {
        id
        attributes ${customer_attributes}
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

const query_get_account = `query GetMyCustomerProfile($id: ID!) {
  customer(id: $id) {
    record: data {
      id
      attributes ${customer_attributes}
    }
  }
}`;

const query_get_by_email = `query GetMyCustomerProfile($email: String!) {
  customers(filters: { email: { eqi: $email } }) {
    records: data {
      id
      attributes ${customer_attributes}
    }
  }
}`;

export async function findCustomerByEmail(email: string) {
  const { data: response } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: query_get_by_email,
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

  if (response.data?.customers?.records?.length) {
    const { id, attributes } = response.data?.customers?.records.pop();
    return {
      ...attributes,
      id: Number(id),
    };
  }
  return {};
}

export async function getCustomer(id: number, agent?: number) {
  const { data: response } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: query_get_account,
      variables: {
        id,
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
    return {
      ...attributes,
      id: Number(id),
    };
  }
}

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
    } else if (response.errors) {
      const { errors } = response as {
        errors: { message: string; extensions?: { error: { details: { errors: { path: string; message: string }[] } } } }[];
      };
      if (errors)
        return {
          errors: errors.map(error => {
            const { message, extensions } = error;
            if (extensions) {
              const { path: field, message } = extensions.error.details.errors[0];
              return capitalizeFirstLetter(
                message.toLowerCase().includes('this attribute')
                  ? message.toLowerCase().split('this attribute').join(field)
                  : extensions.error.details.errors[0].message,
              );
            }
            return message;
          }),
        };
    }
    if (customer_id) {
      const { id: agents_customer_id } = await createAgentCustomer(agent, customer_id);
      return {
        ...customer_data,
        id: customer_id,
        agents_customer_id,
      };
    } else {
      return response;
    }
  } catch (e) {
    const { response } = e as AxiosError;
    return {
      errors: response?.data,
    };
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
