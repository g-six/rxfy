import axios from 'axios';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import { mutation_create_meta, mutation_update_agent } from './graphql';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { AgentInput } from '@/_typings/agent';

export async function getSmart(
  agent: AgentInput & { id: number },
  property: { [key: string]: string | number },
  real_estate_board?: { id: number; name: string; abbreviation: string },
) {
  let prompt = `Retrieve the public information of a realtor named ${agent.full_name} a licenced realtor for ${`${
    real_estate_board?.name ? `(${real_estate_board.name})` : property.city
  } `} with Paragon ID "${agent.agent_id}" from the internet and only use the most recently published source or article anytime from November ${
    new Date().getFullYear() - 1
  } to today. Based on that factual information, write me a realtor bio (JSON key "bio") from a first-person point of view for prospect clients belonging to the demographic looking for listings in the same city or area, a set of SEO metatags (JSON key "metatags") fit for my professional website, website title (JSON key "title") and a well structured, 3-worded, SEO friendly tagline  (JSON key "tagline").  Contain the results in JSON key-value pair format.
  `;
  console.log('---');
  console.log('Processing:');
  // console.log(prompt);
  console.log(`curl ${process.env.NEXT_APP_OPENAI_URI} -H 'content-type: application/json' -H 'Authorization: Bearer ${process.env.NEXT_APP_OPENAI_API}' \\`);
  // console.log(
  //   ' -d',
  //   JSON.stringify({
  //     prompt,
  //     max_tokens: 400,
  //     temperature: 0.2,
  //     model: 'text-davinci-003',
  //   }),
  // );
  console.log('---');
  const { data } = await axios.post(
    `${process.env.NEXT_APP_OPENAI_URI}`,
    {
      prompt,
      max_tokens: 400,
      temperature: 0.1,
      model: 'text-davinci-003',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_APP_OPENAI_API}`,
      },
    },
  );
  try {
    // axios
    //   .post(
    //     `${process.env.NEXT_APP_OPENAI_URI}`,
    //     {
    //       prompt,
    //       max_tokens: 400,
    //       temperature: 0.1,
    //       model: 'text-davinci-003',
    //     },
    //     {
    //       headers: {
    //         'Content-Type': 'application/json',
    //         Authorization: `Bearer ${process.env.NEXT_APP_OPENAI_API}`,
    //       },
    //     },
    //   )
    // .then(({ data }) => {
    const {
      choices: [{ text }],
      error,
    } = data;
    console.log(
      JSON.stringify(
        {
          error: error || {},
        },
        null,
        4,
      ),
    );
    const ai_results = JSON.parse(text.trim());
    console.log(
      JSON.stringify(
        {
          ai_results,
        },
        null,
        4,
      ),
    );
    if (ai_results.bio) {
      const { target_city, lat, lng } = property;
      const metatag = {
        agent_id: agent.agent_id,
        target_city,
        lat,
        lng,
        title: agent.full_name,
        personal_title: ai_results.tagline,
        personal_bio: ai_results.bio,
        description: ai_results.metatags,
        profile_slug: [
          `${real_estate_board?.abbreviation || 'la'}`,
          slugifyAddress(agent.full_name).split('-')[0],
          `${`${agent.phone}`.split('').reverse().join('').substring(0, 4).split('').reverse().join('')}`,
        ].join('-'),
      };

      const created_metatag = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: mutation_create_meta,
          variables: {
            data: metatag,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const agent_metatag = Number(created_metatag.data?.data?.createAgentMetatag?.data.id);

      console.log('Link agent record', agent.id, 'to metadata', { agent_metatag });
      axios
        .post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: mutation_update_agent,
            variables: {
              id: Number(agent.id),
              data: {
                agent_metatag,
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .then(res => {
          console.log(res.data?.data?.updateAgent);
          console.log('...[DONE] mutation_create_meta');
        });

      // .catch(e => {
      //   console.log('OpenAI error for prompt:');
      //   console.log(prompt);
      //   console.log(e);
      // });
    }
    // })
  } catch (e) {
    console.log('OpenAI error for prompt:');
    console.log(prompt);
    console.log(e);
  }
}
