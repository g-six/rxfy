import axios, { AxiosError } from 'axios';
import {
  gql_by_agent_uniq,
  gql_by_realtor_id,
  gql_create_agent,
  mutation_create_meta,
  mutation_create_website_build,
  mutation_update_meta,
  qry_website_build,
} from './graphql';
import { WEBFLOW_THEME_DOMAINS } from '@/_typings/webflow';
import { RealEstateBoardDataModel } from '@/_typings/real-estate-board';
import { AgentData, AgentInput } from '@/_typings/agent';
import { getSmart } from './repair';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { getRealEstateBoard } from '../real-estate-boards/model';
import { MLSProperty } from '@/_typings/property';
import { mutation_update_agent } from './graphql';
import { SearchHighlightInput } from '@/_typings/maps';
import { cache } from 'react';
import { createCacheItem } from '../_helpers/cache-helper';

export async function createAgent(user_data: {
  agent_id: string;
  email: string;
  phone?: string;
  street_1?: string;
  street_2?: string;
  encrypted_password?: string;
  full_name: string;
  real_estate_board_id?: number;
}) {
  try {
    const parts = `${user_data.full_name.split('PREC*').join('').trim()}`.split(' ');
    let last_name = parts.pop();
    let first_name = parts.join(' ');
    let profile_slug = `la-${user_data.agent_id}-${(user_data.phone || '').split('').slice(-3).join('')}`.toLowerCase();

    const metatag_response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: mutation_create_meta,
        variables: {
          data: {
            agent_id: user_data.agent_id,
            title: 'Your Go-To Realtor',
            profile_slug,
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

    const agent_response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_create_agent,
        variables: {
          data: {
            agent_metatag: Number(metatag_response.data.data.createAgentMetatag.data.id),
            agent_id: user_data.agent_id,
            email: user_data.email,
            phone: user_data.phone,
            full_name: user_data.full_name,
            street_1: user_data.street_1,
            street_2: user_data.street_2,
            first_name,
            last_name,
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
      metatags: agent.agent_metatag?.data
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

    let website_build: { [k: string]: unknown } = {};
    if (user_data.website_theme) {
      website_build = {
        ...website_build,
        theme: user_data.website_theme as string,
      };
      const website_build_response = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: mutation_create_website_build,
          variables: {
            theme: user_data.website_theme,
            agent: id,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const website_record = website_build_response.data?.data?.createWebsiteBuild.record || {};
      if (website_record.id) {
        const { attributes: website_agent } = website_record.attributes.agent.record;
        website_build = {
          ...website_build,
          id: Number(website_record.id),
          agent: {
            ...website_agent,
            id,
          },
        };
      }
    }
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
      website_build: Object.keys(website_build).length ? website_build : undefined,
    };
  } catch (e) {
    const axerr = e as AxiosError;
    console.log('Error in updateAgent');
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
            axerr,
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
  const { agent_id, profile_slug, target_city, email, full_name, neighbourhoods, phone } = attributes;

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
    return;
  } else if (!record.attributes.agent_metatag?.data) {
    console.log('');
    console.log('');
    console.log('agent metatag record does not exist');
    console.log('');
    const recent = await getMostRecentListing(agent_id, target_city);

    const property = recent as { [key: string]: string | number };
    const { real_estate_board } = recent as {
      real_estate_board: {
        id: number;
        abbreviation: string;
        name: string;
      };
    };
    await getSmart(
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

/**
 * Returns cached agent data (including metatags)
 * There is a trade-off of delta - 1 for the most recent info
 * but it's something we can live by for now.
 */
export const findAgentRecordByAgentId = cache(async (agent_id: string) => {
  const url = `https://${process.env.NEXT_APP_S3_PAGES_BUCKET}/agent-records/${agent_id}.json`;
  let response = {};
  try {
    const cache = await axios.get(url);
    // We're still gonna update their data behind the scenes.
    // Difference is, we're not gonna wait for the response
    findAgentBy({ agent_id }).then(r => {
      createCacheItem(JSON.stringify(r, null, 4), `agent-records/${agent_id}.json`);
    });
    response = cache.data;
  } catch (e) {
    response = await findAgentBy({ agent_id });
    createCacheItem(JSON.stringify(response, null, 4), `agent-records/${agent_id}.json`);
  }
  return response as any;
});

export const findAgentRecordByRealtorId = cache(async (realtor_id: number) => {
  const query = {
    query: gql_by_realtor_id,
    variables: {
      id: realtor_id,
    },
  };
  const { data: response_data } = await axios.post(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, query, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
      'Content-Type': 'application/json',
    },
  });
  const { email, last_activity_at, ...relationships } = response_data?.data?.realtor.data?.attributes;
  const agent = relationships.agent?.data?.attributes
    ? {
        ...relationships.agent.data.attributes,
        id: Number(relationships.agent.data.id),
      }
    : {};
  return {
    email,
    last_activity_at,
    agent_id: agent?.agent_id || undefined,
    agent: agent?.id || undefined,
  };
});

export async function getMostRecentListing(agent_id: string, city: string, size: number = 1): Promise<unknown> {
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

export async function createAgentRecord(agent: {
  agent_id: string;
  email: string;
  phone: string;
  full_name: string;
  search_highlights?: SearchHighlightInput[];
}) {
  let street_1, street_2, real_estate_board_id;
  try {
    if (agent.search_highlights) {
      const [{ subarea_community, area, title: address, city, state_province, style_type, beds, baths, ...mls_data }] = await retrieveFromLegacyPipeline({
        from: 0,
        size: 3,
        sort: {
          'data.ListingDate': 'desc',
        },
        query: {
          bool: {
            filter: [{ match: { 'data.Status': 'Active' } }, { match: { 'data.City': agent.search_highlights[0].name } }],
            should: agent.search_highlights.length === 1 ? [] : agent.search_highlights.slice(1).map(highlight => ({ match: { 'data.Area': highlight.name } })),
          },
        },
      });

      street_1 = city;
      street_2 = state_province;
      const real_estate_board = await getRealEstateBoard(mls_data as unknown as { [key: string]: string });
      real_estate_board_id = real_estate_board.id;
    }

    const new_agent = await createAgent({
      real_estate_board_id,
      ...agent,
      street_1,
      street_2,
    });

    return new_agent;
  } catch (e) {
    console.log('Caught error in createAgentRecordIfNoneFound');
    console.error(e);
  }
}

export async function createAgentRecordIfNoneFound({ agent_id, email, phone, full_name }: AgentInput, real_estate_board?: RealEstateBoardDataModel) {
  if (!email) return;
  if (!agent_id) return;

  if (!full_name) return;

  try {
    let agent = await findAgentRecordByAgentId(agent_id);

    const parts = `${full_name.split('PREC*').join('').trim()}`.split(' ');
    let last_name = parts.pop();
    let first_name = parts.join(' ');

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

    return agent;
  } catch (e) {
    console.log('Caught error in createAgentRecordIfNoneFound');
    console.error(e);
  }
}

export async function getMostRecentWebsiteThemeRequest(agent: number) {
  const response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: qry_website_build,
      variables: {
        agent,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const response_data = response ? response.data?.data?.websiteBuilds : {};
  return response_data.data
    ? {
        ...response_data.data[0].attributes,
        id: Number(response_data.data[0].id),
      }
    : null;
}
