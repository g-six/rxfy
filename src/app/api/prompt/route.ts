import axios from 'axios';
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
  const ai_response = await axios.post(
    `${process.env.NEXT_APP_OPENAI_URI}`,
    {
      prompt,
      max_tokens: 100,
      temperature: 0.01,
      top_p: 1.0,
      model: 'text-davinci-003',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_APP_OPENAI_API}`,
      },
    },
  );
  const [{ text }] = ai_response.data.choices;
  const json = JSON.parse(text);
  if (json.dwelling_type) {
    const dwelling_type = await getDwellingType(json.dwelling_type);
    if (dwelling_type) {
      return getResponse({
        ...json,
        dwelling_type: dwelling_type.id,
        strapi: {
          dwelling_type,
        },
      });
    }
  }
  return getResponse(json);
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
