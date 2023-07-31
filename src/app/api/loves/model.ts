import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, PROPERTY_ASSOCIATION_KEYS, PropertyDataModel } from '@/_typings/property';
import axios from 'axios';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const gql_get_loved = `query GetLovedProperty($filters: LoveFiltersInput!, $pagination: PaginationArg!) {
    loves(filters: $filters, pagination: $pagination, sort: "createdAt:desc") {
        data {
            id
            attributes {
                notes
                property {
                    data {
                        id
                        attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
                    }
                }
            }
        }
    }
  }`;

export async function getLovedHomes(customer: number, property_id?: number) {
  const love_response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_get_loved,
      variables: {
        filters: { ...(property_id ? { property: { id: { eq: property_id } } } : {}), customer: { id: { eq: customer } } },
        pagination: { pageSize: 100 },
      },
    },
    {
      headers,
    },
  );

  return (
    love_response.data.data.loves.data as {
      id: number;
      attributes: {
        notes: string;
        property: {
          data: {
            id: number;
            attributes: PropertyDataModel;
          };
        };
      };
    }[]
  ).map(({ id, attributes }) => {
    const {
      property: { data: property_data },
      ...love
    } = attributes;

    const relationships: {
      [key: string]: string[];
    } = {};
    PROPERTY_ASSOCIATION_KEYS.map(relationship => {
      const { [relationship]: rel } = property_data.attributes as unknown as {
        [k: string]: {
          data: {
            attributes: {
              name: string;
            };
            id: number;
          }[];
        };
      };
      if (rel?.data && Array.isArray(rel.data)) {
        try {
          relationships[relationship] = rel.data.map(r => r.attributes.name);
        } catch (e) {
          console.log('getLovedHomes error in', relationship);
        }
      }
    });

    return {
      ...love,
      id: Number(id),
      property: {
        ...property_data.attributes,
        ...relationships,
        id: Number(property_data.id),
      },
    };
  });
}
