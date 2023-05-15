import axios, { AxiosError } from 'axios';
import { getRealEstateBoard } from './properties/route';
import { getCombinedData } from '@/_utilities/data-helpers/listings-helper';
import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, MLSProperty, PropertyDataModel } from '@/_typings/property';
import { createAgentRecordIfNoneFound } from './agents/route';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
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

export async function createAgentsFromProperty(p: MLSProperty, real_estate_board: { id: number; abbreviation: string }) {
  const agents: number[] = [];
  for await (const num of [1, 2, 3]) {
    const agent_id = p[`LA${num}_LoginName`] as string;
    const email = p[`LA${num}_Email`] as string;
    let full_name = p[`LA${num}_FullName`] as string;
    full_name = full_name.split(' PREC').join('').split('*').join('');
    const phone = p[`LA${num}_PhoneNumber1`] as string;
    if (agent_id && email && phone && full_name) {
      const [year, month, day] = p.ListingDate.substring(0, 10).split('-').map(Number);
      const agent = await createAgentRecordIfNoneFound({
        agent_id,
        email,
        phone,
        full_name,
        listing: p.L_PublicRemakrs,
        real_estate_board: real_estate_board?.id,
        lat: p.lat,
        lng: p.lng,
        target_area: p.Area,
        target_city: p.City,
        asking_price: p.AskingPrice,
        listing_date: `${day}/${month}/${year}`,
        property_type: `${p.PropertyType}`.trim(),
        beds: p.L_BedroomTotal,
        baths: p.L_TotalBaths,
        profile_slug: [
          `${real_estate_board.abbreviation}`,
          slugifyAddress(full_name as string).split('-')[0],
          `${phone.split('').reverse().join('').substring(0, 4).split('').reverse().join('')}`,
        ].join('-'),
      });
      agents.push(agent.id);
    }
  }

  return agents;
}
