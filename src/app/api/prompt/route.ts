import axios, { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import { getResponse } from '../response-helper';

const ai_instructions = `Convert the real estate property above into a Javascript Object based on the following structure (with all attributes being optional):
{
    "beds": number,
    "baths": number,
    "dwelling_type": string 
    "panoramic_view": (optional) string
}
Additionally, remove any attributes from the above JSON if they are not available in the description and the "property_type" attribute should be restricted to the following values:
1. Townhouse
2. Manufactured
3. Apartment/Condo
4. Residential Detached
5. 1/2 Duplex
6. Duplex
7. Triplex
8. Other`;

export async function POST(req: NextRequest) {
  const payload = await req.json();
  let prompt =
    'A JSON summarizing the real estate property:\n\n' +
    payload.description +
    '\nContain the results in the following JSON format:\n{ "beds": Bedrooms, "baths": Bathrooms, "dwelling_type": Style of Home, "panoramic_view": "View" }';
  //   prompt = `\n\n ${ai_instructions}`;

  try {
    const ai_response = await axios.post(
      // `${process.env.NEXT_APP_OPENAI_URI}`,
      'https://api.openai.com/v1/chat/completions',
      {
        messages: [{ role: 'user', content: prompt }],
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 2773,
        temperature: 0.01,
        top_p: 1.0,
        model: 'gpt-4',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_APP_OPENAI_API}`,
        },
      },
    );
    const [
      {
        message: { content },
      },
    ] = ai_response.data.choices;
    const json = JSON.parse(content);
    let { beds, baths } = json;
    if (isNaN(beds)) beds = 0;
    if (isNaN(baths)) baths = 0;
    if (json.dwelling_type) {
      const dwelling_type = await getDwellingType(json.dwelling_type);
      if (dwelling_type) {
        return getResponse({
          ...json,
          beds,
          baths,
          dwelling_type: dwelling_type.id,
          description: payload.description,
          strapi: {
            dwelling_type,
          },
        });
      }
    }
    return getResponse(json);
  } catch (e) {
    const { response } = e as AxiosError;
    console.log(e);
    if (!response)
      return getResponse(
        {
          error: 'Error in api/prompt',
        },
        400,
      );
    const { data } = response as unknown as {
      data: {
        error: unknown[];
      };
    };

    console.error(JSON.stringify(data, null, 4));
    return getResponse(data, 400);
  }
}

async function getDwellingType(property_type: string) {
  const api_url = `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`;
  if (api_url) {
    const gql_params: {
      query: string;
      variables?: {
        [key: string]: string;
      };
    } = {
      query: QRY_PROPERTY_DWELLING_TYPES,
      variables: {
        name: property_type,
      },
    };
    const leagent_cms_res = await axios.post(api_url, gql_params, { headers });
    const dwelling_type = leagent_cms_res.data.data?.types?.records[0];
    if (dwelling_type) {
      return {
        ...dwelling_type.attributes,
        id: Number(dwelling_type.id),
      };
    }
    return { id: 10, name: 'Other' };
  }
  return {};
}

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const QRY_PROPERTY_DWELLING_TYPES = `query DwellingType($name: String!) {
  types: dwellingTypes(
    filters: {
      or: [{ name: { containsi: $name } }, { synonyms: { containsi: $name } }]
    }
    pagination: { limit: 100 }
  ) {
    records: data {
      id
      attributes {
        name
      }
    }
  }
}

`;
