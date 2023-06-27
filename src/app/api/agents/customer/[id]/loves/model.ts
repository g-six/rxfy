import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, LovedPropertyDataModel } from '@/_typings/property';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import axios, { AxiosError } from 'axios';

export const query_get_customer_loves = `query CustomerLoves ($id: ID!) {
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

export async function getCustomerLoves(id: number) {
  let properties: LovedPropertyDataModel[] = [];
  try {
    const { data: response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: query_get_customer_loves,
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

    if (response?.data?.agentsCustomer?.data?.attributes?.customer?.data?.attributes?.loves?.data) {
      properties = response.data.agentsCustomer.data.attributes.customer.data.attributes.loves.data.map(
        (love: { id: number; attributes: { property: { data: { id: number; attributes: LovedPropertyDataModel } } } }) => {
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
          let cover_photo;
          if (property_attributes.property_photo_album?.data?.attributes?.photos) {
            photos = property_attributes.property_photo_album?.data?.attributes?.photos as unknown as string[];
            if (cover_photo === undefined) {
              cover_photo = getImageSized(photos[0], 400);
            }
          }
          return {
            ...property_attributes,
            mls_data: undefined, // This is too heavy (coming from legacy),
            listing_by,
            photos,
            cover_photo,
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
  }

  return properties;
}
