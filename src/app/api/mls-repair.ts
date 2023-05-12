import axios, { AxiosError } from 'axios';
import { getRealEstateBoard } from './properties/route';
import { getCombinedData } from '@/_utilities/data-helpers/listings-helper';
import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, MLSProperty, PropertyDataModel } from '@/_typings/property';
const gql_update_home = `mutation UpdateHome($id: ID!, $updates: PropertyInput!) {
    updateProperty(id: $id, data: $updates) {
      data {
        id
        attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
      }
    }
  }`;
export async function repairIfNeeded(id: number, property: { [key: string]: unknown } & PropertyDataModel, mls_data: MLSProperty & { [key: string]: string }) {
  const null_count = Object.keys(property).filter(k => property[k] === null).length;
  if (null_count > 10) {
    // Too many null fields, attempt to repair
    let output = {
      ...property,
      ...getCombinedData({
        id,
        attributes: {
          ...property,
          mls_data,
        },
      }),
      id,
    };

    try {
      const { id: board } = await getRealEstateBoard(mls_data);

      const updates = {
        ...output,
        real_estate_board: board,
        listed_at: `${output.listed_at}`.substring(0, 10),
        id: undefined,
      };
      delete updates.property_photo_album;

      await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_update_home,
          variables: {
            id: output.id,
            updates,
          },
        },
        {
          headers,
        },
      );
      return updates;
    } catch (update_error) {
      const err = update_error as AxiosError;
      console.log('Caught exception for update property');
      console.log(err.response?.data);
    }
  }
  return {};
}
