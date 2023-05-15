import axios from 'axios';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

export async function getRealEstateBoard({
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
  try {
    //CMS_GRAPH_URL
    const gql_params = {
      query: `query GetBoardByName($name:String!) {
            realEstateBoards(filters: { name: { eqi: $name } }) {
              records: data {
                id
                attributes {
                  name
                  legal_disclaimer
                  abbreviation
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
    return isNaN(board_id)
      ? undefined
      : {
          ...leagent_cms_res.data?.data?.realEstateBoards.records[0].attributes,
          id: board_id,
        };
  } catch (e) {
    console.log('Caught error in getRealEstateBoard');
  }
  return undefined;
}
