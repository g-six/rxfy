import axios, { AxiosError } from 'axios';
import { getResponse } from '../response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { getCombinedData } from '@/_utilities/data-helpers/listings-helper';
import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, MLSProperty, PropertyDataModel } from '@/_typings/property';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_find_home = `query FindHomeByMLSID($mls_id: String!) {
  properties(filters:{ mls_id:{ eq: $mls_id}}, pagination: {limit:1}) {
    data {
      id
      attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
    }
  }
}`;

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
      const board = await getRealEstateBoard(mls_data);

      const updates = {
        ...output,
        real_estate_board: board,
        listed_at: `${output.listed_at}`.substring(0, 10),
        id: undefined,
      };
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
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mls_id = url.searchParams.get('mls_id');
  const results = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_find_home,
      variables: {
        mls_id,
      },
    },
    {
      headers,
    },
  );
  if (results?.data?.data?.properties?.data?.length) {
    const [record] = results?.data.data.properties.data;
    const { mls_data, ...property } = record.attributes;
    let output: {
      [key: string]: string | number | boolean | string[] | Date;
    } = {
      ...property,
      id: Number(record.id),
    };
    const repaired = await repairIfNeeded(Number(record.id), property, mls_data);

    Object.keys(property).forEach(key => {
      if (property[key]) {
        output = {
          ...output,
          ...repaired,
          [key]: property[key],
        };
      }
    });
    mls_data &&
      Object.keys(mls_data).forEach(key => {
        if (mls_data[key]) {
          switch (key) {
            case 'photos':
              if (mls_data[key].length > 0) {
                const photos = mls_data[key] as string[];
                output = {
                  ...output,
                  thumbnail: `https://e52tn40a.cdn.imgeng.in/w_720/${photos[0]}`,
                  photos: photos.slice(1).map(photo_url => {
                    return getImageSized(photo_url, 999);
                  }),
                };
              }
              break;
            case 'Address':
            case 'Status':
            case 'Remarks':
              output = {
                ...output,
                [key.toLowerCase()]: capitalizeFirstLetter(mls_data[key].toLowerCase()),
              };
              break;
            case 'L_PublicRemakrs':
              output = {
                ...output,
                description: capitalizeFirstLetter(mls_data[key].toLowerCase()),
              };
              break;
            case 'L_TotalBaths':
              output = {
                ...output,
                baths: Number(mls_data[key]),
              };
              break;
            case 'B_Style':
              output = {
                ...output,
                style: mls_data[key],
                [key]: mls_data[key],
              };
              break;
            case 'LandTitle':
              output = {
                ...output,
                land_title: mls_data[key],
                [key]: mls_data[key],
              };
              break;
            // default:
            //   output = {
            //     ...output,
            //     [key]: mls_data[key] !== null ? mls_data[key] : undefined,
            //   };
            //   break;
          }
        }
      });

    return getResponse(
      {
        id: record.id,
        property: output,
      },
      200,
    );
  }
  return getResponse(results?.data || {}, 200);
}

async function getRealEstateBoard({
  L_ShortRegionCode,
  OriginatingSystemName,
  LA1_Board,
  LA2_Board,
  LA3_Board,
  LA4_Board,
  ListAgent1,
  LO1_Brokerage,
}: {
  [name: string]: string;
}) {
  //CMS_GRAPH_URL
  const gql_params = {
    query: `query GetBoardByName($name:String!) {
        realEstateBoards(filters: { name: { eqi: $name } }) {
          records: data {
            id
            attributes {
              legal_disclaimer
            }
          }
        }
      }`,
    variables: {
      name: L_ShortRegionCode || OriginatingSystemName || LA1_Board || LA2_Board || LA3_Board || LA4_Board || ListAgent1 || LO1_Brokerage,
    },
  };

  const leagent_cms_res = await axios.post(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, gql_params, { headers });
  const board_id = Number(leagent_cms_res.data?.data?.realEstateBoards.records[0].id);
  return isNaN(board_id) ? undefined : board_id;
}
