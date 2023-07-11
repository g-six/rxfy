import axios from 'axios';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_update_customer = `mutation UpdateCustomerDocuments($id: ID!, $documents: [ID]) {
    updateCustomer(id: $id, data: { documents: $documents }) {
        record: data {
            attributes {
                documents {
                    records: data {
                        id
                        attributes {
                            name
                            document_uploads {
                                records: data {
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
                    }
                }
            }
        }
    }
}`;

const gql_document = `mutation CreateDocument ($data: DocumentInput!) {
    createDocument(data: $data) {
      data {
        id
        attributes {
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
          name
          agent {
            data {
              id
            }
          }
        }
      }
    }
}`;

const gql_customer = `query GetCustomerRelationship($id: ID!) {
    customer(id: $id) {
        record: data {
            attributes {
                documents {
                  records: data {
                    id
                  }
                }
            }
        }
    }
}`;

export async function createDocumentFolder(name: string, customer_id: number, agent_record_id: number) {
  const { data: folder_response } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_document,
      variables: {
        data: {
          customer: customer_id,
          agent: agent_record_id,
          name,
        },
      },
    },
    {
      headers,
    },
  );

  let document;

  if (folder_response.data?.createDocument?.data?.id) {
    const { attributes, ...folder } = folder_response.data?.createDocument?.data;
    document = {
      ...attributes,
      id: Number(folder.id),
    };

    const {
      data: {
        data: { customer },
      },
    } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_customer,
        variables: {
          id: customer_id,
        },
      },
      {
        headers,
      },
    );

    const documents: number[] = customer.record.attributes.documents.records.map((doc: { [key: string]: string }) => {
      return Number(doc.id);
    });

    documents.push(document.id);

    const {
      data: {
        data: {
          updateCustomer: {
            record: {
              attributes: {
                documents: { records: updated_documents },
              },
            },
          },
        },
      },
    } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_update_customer,
        variables: {
          id: customer_id,
          documents,
        },
      },
      {
        headers,
      },
    );

    updated_documents.map(
      (rec: {
        attributes: {
          [key: string]: string;
        };
        id: string;
      }) => ({
        ...rec.attributes,
        id: Number(rec.id),
      }),
    );
  }

  return document;
}
