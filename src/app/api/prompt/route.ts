import axios from 'axios';
import { NextRequest } from 'next/server';
import { getResponse } from '../response-helper';

const ai_instructions = `Convert the real estate property above into a Javascript Object based on the following structure (with all attributes being optional):
{
    "beds": number,
    "baths": number,
    "property_type": string 
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
    '\nContain the results in the following JSON format:\n{ "beds": Bedrooms, "baths": Bathrooms, "property_type": Style of Home, "panoramic_view": "View" }';
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
  return getResponse(json);
}
