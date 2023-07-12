import { CustomerSavedSearch } from '@/_typings/saved-search';
import axios, { AxiosError } from 'axios';

const GQ_FRAG_SAVED_SEARCH = `
                  id
                  attributes {
                      beds
                      baths
                      minprice
                      maxprice
                      minsqft
                      maxsqft
                      lat
                      lng
                      nelat
                      nelng
                      swlat
                      swlng
                      zoom
                      type
                      sorting
                      is_active
                      dwelling_types {
                        data {
                            id
                            attributes {
                              name
                            }
                        }
                      }
                      add_date
                      year_built
                      tags
                      area
                      city
                  }
`;
export const query_get_customer_searches = `query CustomerSearches ($id: ID!) {
  agentsCustomer(id: $id) {
    data {
      attributes {
        customer {
          data {
            id
            attributes {
              saved_searches {
                data {${GQ_FRAG_SAVED_SEARCH}}
              }
            }
          }
        }
      }
    }
  }
}`;

export async function getCustomerSearches(id: number) {
  let records: CustomerSavedSearch[] = [];
  try {
    const { data: response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: query_get_customer_searches,
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

    if (response?.data?.agentsCustomer?.data?.attributes?.customer?.data?.attributes?.saved_searches?.data) {
      records = response.data.agentsCustomer.data.attributes.customer.data.attributes.saved_searches.data.map((record: { id: number; attributes: unknown }) => {
        const { id: saved_search_id, attributes } = record;
        const { dwelling_types } = attributes as {
          dwelling_types: {
            data: {
              id: number;
              attributes: {
                name: string;
              };
            }[];
          };
        };
        const data = attributes as CustomerSavedSearch;

        return {
          ...data,
          dwelling_types: dwelling_types && dwelling_types.data.map(({ id, attributes: { name: dwelling_type } }) => dwelling_type),
          id: Number(saved_search_id),
        };
      });
    }
  } catch (e) {
    const axerr = e as AxiosError;
    if (axerr.response?.data) {
      console.log(JSON.stringify(axerr.response.data, null, 4));
    }
  }

  return records;
}
