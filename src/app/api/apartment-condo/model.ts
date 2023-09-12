import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, PropertyDataModel } from '@/_typings/property';
import { ApartmentCondoInput, ApartmentCondoRecord } from './types';
import axios from 'axios';

export async function createApartmentCondo(input: ApartmentCondoInput): Promise<ApartmentCondoRecord> {
  const response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_create,
      variables: {
        input,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
    },
  );
  return response?.data?.data?.CreateApartmentCondoRecord?.record || {};
}
// export async function getTenants(property: PropertyDataModel): Promise<ApartmentCondoRecord> {
//   const { title, city, postal_zip_code, state_province } = property;
//   const response = await axios.post(
//     `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
//     {
//       query: gql_create,
//       variables: {
//         input,
//       },
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
//         'Content-Type': 'application/json',
//       },
//     },
//   );
//   return response?.data?.data?.CreateApartmentCondoRecord?.record || {};
// }

const GQ_ATTRIBUTES = `
                name
                address
                lat
                lng
                postal_zip_code
                state_province
                country
                mls_id
                mapbox_id
                property {
                    data {
                        attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
                    }
                }
`;
const gql_create = `mutation CreateApartmentCondoRecord($input: ApartmentCondoInput!) {
	createApartmentCondo(data: $input) {
        record: data {
            id
            attributes {${GQ_ATTRIBUTES}}
        }
    }
}`;

const gql_retrieve = `query GetBuildingTenants($address: String!, $postal_zip_code: String!, $state_province: String!) {
    apartmentCondos($filters) {
        records: data {
            id
            attributes {${GQ_ATTRIBUTES}}
        }
    }
}`;
