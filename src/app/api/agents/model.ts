import axios, { AxiosError } from 'axios';
import { gql_by_agent_uniq, gql_create_agent, mutation_update_meta } from './graphql';
import { WEBFLOW_THEME_DOMAINS } from '@/_typings/webflow';
import { RealEstateBoardDataModel } from '@/_typings/real-estate-board';
import { AgentInput } from '@/_typings/agent';
import { getSmart } from './repair';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { getRealEstateBoard } from '../real-estate-boards/model';
import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { mutation_update_agent } from './graphql';

export async function createAgent(user_data: {
  agent_id: string;
  email: string;
  phone?: string;
  encrypted_password?: string;
  full_name: string;
  real_estate_board_id?: number;
}) {
  try {
    const agent_response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_create_agent,
        variables: {
          data: {
            agent_id: user_data.agent_id,
            email: user_data.email,
            phone: user_data.phone,
            full_name: user_data.full_name,
            first_name: user_data.full_name.split(' ')[0] || '',
            last_name: user_data.full_name.split(' PREC').join('').split(' ').pop(),
            real_estate_board: user_data.real_estate_board_id,
            webflow_domain: WEBFLOW_THEME_DOMAINS.DEFAULT,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const agent = agent_response?.data?.data?.createAgent?.data || {};
    return {
      ...agent.attributes,
      id: agent.id ? Number(agent.id) : undefined,
      metatags: agent.agent_metatag.data
        ? {
            ...agent.agent_metatag.data.attributes,
            id: Number(agent.agent_metatag.data.id),
          }
        : undefined,
    };
  } catch (e) {
    console.log('Error in createAgent');
    const axerr = e as AxiosError;
    const { error, errors } = axerr.response?.data as {
      error?: {
        code: string;
      };
      errors?: {
        message: string;
        extensions: unknown[];
      }[];
    };
    console.log(
      JSON.stringify(
        {
          error,
          errors,
        },
        null,
        4,
      ),
    );
  }
  return {};
}
export async function updateAgent(
  id: number,
  user_data: {
    [key: string]: unknown;
  },
) {
  try {
    const update_object = {
      id,
      data: user_data,
    };
    const agent_response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: mutation_update_agent,
        variables: update_object,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const agent = agent_response?.data?.data?.updateAgent?.data || {};

    return {
      ...agent.attributes,
      id: agent.id ? Number(agent.id) : undefined,
      metatags: agent.attributes.agent_metatag.data
        ? {
            ...agent.attributes.agent_metatag.data.attributes,
            id: Number(agent.attributes.agent_metatag.data.id),
          }
        : undefined,
    };
  } catch (e) {
    console.log('Error in updateAgent');
    const axerr = e as AxiosError;
    if (axerr.response?.data) {
      const { error, errors } = axerr.response?.data as {
        error?: {
          code: string;
        };
        errors?: {
          message: string;
          extensions: unknown[];
        }[];
      };
      console.log(
        JSON.stringify(
          {
            response: axerr.response,
            error,
            errors,
          },
          null,
          4,
        ),
      );
    } else {
      console.log(
        JSON.stringify(
          {
            response: axerr.response,
          },
          null,
          4,
        ),
      );
    }
  }
  return {};
}
export async function updateAgentMetatags(
  id: number,
  metatags: {
    [key: string]: unknown;
  },
) {
  try {
    const update_object = {
      id,
      data: metatags,
    };
    const metatag_response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: mutation_update_meta,
        variables: update_object,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const results = metatag_response?.data?.data?.updateAgentMetatag?.data || {};
    return {
      ...results.attributes,
      id: results.id ? Number(results.id) : undefined,
    };
  } catch (e) {
    console.log('Error in updateAgentMetatags');
    const axerr = e as AxiosError;
    const { error, errors } = axerr.response?.data as {
      error?: {
        code: string;
      };
      errors?: {
        message: string;
        extensions: unknown[];
      }[];
    };
    console.log(
      JSON.stringify(
        {
          response: axerr.response,
          error,
          errors,
        },
        null,
        4,
      ),
    );
  }
  return {};
}

export async function findAgentBy(attributes: { [key: string]: string }) {
  const { agent_id, profile_slug } = attributes;

  let filters: {
    agent_id?: {
      eqi: string;
    };
    profile_slug?: {
      eqi: string;
    };
  } = {};
  if (agent_id) {
    filters = {
      agent_id: {
        eqi: agent_id,
      },
    };
  } else if (profile_slug) {
    filters = {
      agent_id: {
        eqi: agent_id,
      },
    };
  } else {
    return;
  }

  const query = {
    query: gql_by_agent_uniq,
    variables: {
      filters,
    },
  };
  const { data: response_data } = await axios.post(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, query, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
      'Content-Type': 'application/json',
    },
  });

  let [record] = response_data?.data?.agents.data;
  if (!record) {
    // agent record does not exist,
    console.log('agent record does not exist');
    return record;
  } else if (!record.attributes.agent_metatag?.data) {
    const recent = await getMostRecentListing(agent_id);
    if (recent) {
    }
    const property = recent as { [key: string]: string | number };
    const { real_estate_board } = recent as {
      real_estate_board: {
        id: number;
        abbreviation: string;
        name: string;
      };
    };
    const ai_results = await getSmart(
      {
        agent_id,
        full_name: record.attributes.full_name,
        email: record.attributes.email,
        phone: record.attributes.phone,
        id: record.id,
      },
      property,
      real_estate_board,
    );
    console.log({ ai_results });
  }
  return record?.attributes
    ? {
        ...record.attributes,
        id: Number(record.id),
        metatags: {
          ...record.attributes.agent_metatag.data?.attributes,
          id: record.attributes.agent_metatag.data ? Number(record.attributes.agent_metatag.data.id) : undefined,
        },
      }
    : null;
}
export async function findAgentRecordByAgentId(agent_id: string) {
  return await findAgentBy({ agent_id });
}

export async function getMostRecentListing(agent_id: string, city: string, size: number): Promise<unknown> {
  const legacy_params: LegacySearchPayload = {
    from: 0,
    size: 1,
    query: {
      bool: {
        should: [
          { match: { 'data.LA1_LoginName': agent_id } },
          { match: { 'data.LA2_LoginName': agent_id } },
          { match: { 'data.LA3_LoginName': agent_id } },
          { match: { 'data.Status': 'Active' } },
        ],
        minimum_should_match: 0,
      },
    },
  };
  const legacy_listings = await retrieveFromLegacyPipeline(legacy_params, undefined, 1);

  const listing = legacy_listings.length && legacy_listings[0];
  if (listing) {
    const {
      title,
      description,
      lat,
      lon,
      area: target_area,
      city: target_city,
      asking_price,
      property_type,
      beds,
      baths,
      listed_at: listing_date,
      ...mls_data
    } = listing;
    const legacy = mls_data as unknown as MLSProperty;
    const real_estate_board = await getRealEstateBoard(mls_data as unknown as Record<string, string>);
    let listed_by = legacy.LA1_FullName || legacy.LA2_FullName || legacy.LA3_FullName;
    return {
      ...listing,
      listed_by,
    };
  }
}

export async function createAgentRecord(agent_id: string, email: string, phone: string, full_name: string, target_city: string, neighbourhoods: string) {
  try {
    // const variables = { email };
    const sample_listings = await retrieveFromLegacyPipeline({
      from: 0,
      size: 3,
      query: {
        bool: {
          filter: [{ match: { 'data.Status': 'Active' } }],
          should: [{ match: { 'data.City': target_city } }],
        },
      },
    });

    let first_name = `${full_name}`.split(' ')[0];
    let last_name = `${full_name}`.split(' ').slice(0, 2).pop();
    last_name = (last_name && last_name.split('PREC*').join('').trim()) || '';
    return sample_listings;
  } catch (e) {
    console.log('Caught error in createAgentRecordIfNoneFound');
    console.error(e);
  }
}

export async function createAgentRecordIfNoneFound(
  { agent_id, email, phone, full_name }: AgentInput,
  real_estate_board?: RealEstateBoardDataModel,
  listing?: {
    description: string;
    lat: number;
    lng: number;
    target_area: string;
    target_city: string;
    asking_price: number;
    property_type: string;
    beds: number;
    baths: number;
    listing_date: string;
  },
) {
  if (!email) return;
  if (!agent_id) return;

  if (!full_name) return;

  try {
    // const variables = { email };
    let agent = await findAgentRecordByAgentId(agent_id);

    let first_name = `${full_name}`.split(' ')[0];
    let last_name = `${full_name}`.split(' ').slice(0, 2).pop();
    last_name = (last_name && last_name.split('PREC*').join('').trim()) || '';

    if (!agent) {
      console.log("Agent not found, let's create it");
      const create_this = {
        agent_id,
        full_name: full_name.split('PREC').join('').trim().split('*').join(''),
        first_name,
        last_name,
        phone,
        email,
        real_estate_board_id: real_estate_board?.id || undefined,
      };
      const t = new Date();
      console.log('timestamp', t.toISOString());
      console.log(create_this);
      agent = await createAgent(create_this);
      console.log('');
      console.log('took', [Date.now() - t.getTime(), 'ms'].join(''));
      console.log('---');
    } else {
      console.log(`Agent found, let's use ${first_name} ${last_name}`);
      console.log(JSON.stringify(agent, null, 4));
    }

    // A hook is already working on this
    // if (!agent.metatags?.personal_bio && listing?.description) {
    //   console.log('No agent bio, sprucing it up...');
    //   console.log(`${process.env.NEXT_PUBLIC_API}/opensearch/agent-listings/${agent_id}`);
    //   axios.get(`${process.env.NEXT_PUBLIC_API}/opensearch/agent-listings/${agent_id}`);
    //   const agent_attributes: AgentInput & { id: number } & { [key: string]: string | number } = {
    //     id: Number(agent.id),
    //     ...agent.attributes,
    //     agent_id,
    //     first_name,
    //     last_name,
    //   };

    //   Object.keys(agent_attributes).forEach(k => {
    //     if (agent_attributes[k] === null) delete agent_attributes[k];
    //   });

    //   getSmart(agent_attributes, listing, real_estate_board);
    // }
    return agent;
  } catch (e) {
    console.log('Caught error in createAgentRecordIfNoneFound');
    console.error(e);
  }
}
