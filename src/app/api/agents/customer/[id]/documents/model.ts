import { DocumentDataModel } from '@/_typings/document';
import axios, { AxiosError } from 'axios';

const GQ_FRAG_DOCUMENTS = `
                  id
                  attributes {
                      name
                      document_uploads {
                        data {
                          id
                          attributes {
                            url
                            file_name
                            createdAt
                            updatedAt
                          }
                        }
                      }
                  }
`;
export const query_get_customer_docs = `query CustomerDocuments($customer_id: ID!) {
  documents(filters: { customer: { id: { eq: $customer_id } } }) {
    records: data {${GQ_FRAG_DOCUMENTS}}
  }
}`;

export const query_get_customer = `query Customer($id: ID!) {
  agentsCustomer(id: $id) {
    record: data {
      attributes {
        customer {
          record: data {
            id
          }
        }
      }
    }
  }
}`;

/**
 *
 * @param id agent_customer_id
 * @returns
 */
export async function getCustomerDocuments(id: number) {
  let records: DocumentDataModel[] = [];
  try {
    const { data: response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: query_get_customer,
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
    if (response?.data?.agentsCustomer?.record?.attributes?.customer?.record?.id) {
      const { data: docs } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: query_get_customer_docs,
          variables: {
            customer_id: Number(response.data?.agentsCustomer?.record?.attributes?.customer?.record?.id),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (docs?.data?.documents?.records) {
        records = docs.data.documents.records.map((record: { id: number; attributes: unknown }) => {
          const { id: document_id, attributes } = record;
          const data = attributes as {
            [key: string]: unknown;
          };

          return {
            ...data,
            id: Number(document_id),
          };
        });
      }
    }
  } catch (e) {
    const axerr = e as AxiosError;
    if (axerr.response?.data) {
      console.log(JSON.stringify(axerr.response.data, null, 4));
    }
  }

  return records;
}
