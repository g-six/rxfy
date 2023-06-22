import { getResponse } from '@/app/api/response-helper';
import axios, { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import { GET as checkSession } from '@/app/api/check-session/route';
import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, PropertyDataModel } from '@/_typings/property';
const query_get_customer_loves = `query CustomerLoves ($id: ID!) {
  agentsCustomer(id: $id) {
    data {
      attributes {
        customer {
          data {
            id
            attributes {
              loves {
                data {
                  id
                  attributes {
                    property {
                      data {
                        id
                        attributes {
                          ${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}
                        }
                      }
                    }
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

export async function GET(request: NextRequest) {
  const agents_customer_id = Number(request.url.split('/loves')[0].split('/').pop());
  if (isNaN(agents_customer_id)) {
    return getResponse({
      error: 'Please provide a valid id for the agent customer record',
    });
  }
  const agent = await checkSession(request, true);

  const {
    id: realtor,
    customers,
    session_key,
  } = agent as unknown as {
    id: number;
    customers: { notes: string[]; id: number }[];
    session_key: string;
  };
  if (!session_key) {
    return getResponse({
      error: "Please login to retrieve your customer's loved homes",
    });
  }
  const [customer] = customers.filter(c => c.id === agents_customer_id);

  if (!customer) {
    return getResponse({
      error: 'Please provide a valid customer relationship id',
    });
  }

  let properties: PropertyDataModel[] = [];
  try {
    const { data: response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: query_get_customer_loves,
        variables: {
          id: customer.id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response?.data?.agentsCustomer?.data?.attributes?.customer?.data?.attributes?.loves?.data) {
      properties = response.data.agentsCustomer.data.attributes.customer.data.attributes.loves.data.map(
        (love: { id: number; attributes: { property: { data: { id: number; attributes: PropertyDataModel } } } }) => {
          const { id: loved_id, attributes } = love;
          const { id: property_id, attributes: property_attributes } = attributes.property.data;
          let listing_by = '';
          if (property_attributes.mls_data) {
            const { LA1_FullName, LA2_FullName, LA3_FullName, SO1_FullName, SO2_FullName, SO3_FullName, LO1_Name, LO2_Name, LO3_Name } =
              property_attributes.mls_data;

            listing_by = LA1_FullName || LA2_FullName || LA3_FullName || SO1_FullName || SO2_FullName || SO3_FullName || LO1_Name || LO2_Name || LO3_Name || '';
            if (listing_by) listing_by = `Listing courtesy of ${listing_by}`;
          }
          let photos: string[] = [];
          if (property_attributes.property_photo_album?.data?.attributes?.photos) {
            photos = property_attributes.property_photo_album?.data?.attributes?.photos as unknown as string[];
          }
          return {
            ...property_attributes,
            mls_data: undefined, // This is too heavy (coming from legacy),
            listing_by,
            photos,
            id: Number(property_id),
            love: Number(loved_id),
          };
        },
      );
    }
  } catch (e) {
    const axerr = e as AxiosError;
    if (axerr.response?.data) {
      console.log(JSON.stringify(axerr.response.data, null, 4));
    }
    return getResponse({
      error: 'Unable to retrieve loved homes. Please check vercel logs.',
    });
  }
  return getResponse({
    properties,
    session_key,
  });
}
