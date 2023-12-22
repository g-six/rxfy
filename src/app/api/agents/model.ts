import axios, { AxiosError } from 'axios';
import {
  gql_agent_id_inventory,
  gql_brokerage_realtors,
  gql_by_agent_uniq,
  gql_by_realtor_id,
  gql_create_agent,
  gql_metatag_by_agent_id,
  mutation_add_to_inventory,
  mutation_create_meta,
  mutation_create_website_build,
  mutation_update_meta,
  qry_website_build,
} from './graphql';
import { WEBFLOW_THEME_DOMAINS } from '@/_typings/webflow';
import { RealEstateBoardDataModel } from '@/_typings/real-estate-board';
import { AIGeneratedDetails, AgentData, AgentInput } from '@/_typings/agent';
import { getSmart } from './repair';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { getRealEstateBoard } from '../real-estate-boards/model';
import { MLSProperty } from '@/_typings/property';
import { mutation_update_agent } from './graphql';
import { SearchHighlightInput } from '@/_typings/maps';

import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { createTask } from '../clickup/model';
import { formatValues, slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { consoler } from '@/_helpers/consoler';
import { getAgentBrokerages } from '../brokerages/model';

const FILE = 'api/agents/model.ts';
export const maxDuration = 300;
export async function createAgent(
  user_data: {
    agent_id: string;
    email: string;
    phone: string;
    street_1?: string;
    street_2?: string;
    encrypted_password?: string;
    full_name: string;
    real_estate_board_id?: number;
  },
  ai_results?: AIGeneratedDetails,
  property_id?: number,
) {
  try {
    const parts = `${user_data.full_name.split('PREC*').join('').trim()}`.split(' ');
    let last_name = parts.pop();
    let first_name = parts.join(' ');
    let profile_slug = slugifyAddress(
      `la-${first_name}-${user_data.agent_id}-${user_data.phone.split('').reverse().slice(0, 4).reverse().join('')}`.toLowerCase(),
    );

    const metatag_response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: mutation_create_meta,
        variables: {
          data: {
            agent_id: user_data.agent_id,
            title: ai_results?.title || 'Your Go-To Realtor',
            description: ai_results?.bio ? ai_results.bio.split('. ').slice(0, 2).join('. ') : '',
            personal_title: ai_results?.tagline || '',
            personal_bio: ai_results?.bio || ai_results?.tagline || '',
            target_city: ai_results?.city || '',
            profile_slug,
            ...(ai_results?.lat !== undefined
              ? {
                  lat: ai_results.lat,
                  lng: ai_results.lng,
                  geocoding: {
                    city: ai_results.city,
                    lat: ai_results.lat,
                    lng: ai_results.lng,
                    zoom: 13,
                    nelat: ai_results.nelat,
                    nelng: ai_results.nelng,
                    swlat: ai_results.swlat,
                    swlng: ai_results.swlng,
                  },
                  search_highlights: {
                    labels: [
                      {
                        zoom: 12,
                        title: ai_results.city,
                        name: ai_results.city,
                        lat: ai_results.lat,
                        lng: ai_results.lng,
                        ne: {
                          lat: ai_results.nelat,
                          lng: ai_results.nelng,
                        },
                        sw: {
                          lat: ai_results.swlat,
                          lng: ai_results.swlng,
                        },
                      },
                    ],
                  },
                }
              : {}),
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
    if (property_id) {
      await addToAgentInventory(
        {
          agent_id: agent.attributes.agent_id,
          agent: Number(agent.id),
        },
        Number(property_id),
      );
    }
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
    console.error(e);
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
    consoler(
      FILE,
      'createAgent',
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
        createTask(
          `${capitalizeFirstLetter(user_data.website_theme as string)} Theme Request by ${website_agent.agent_id || website_agent.full_name}`,
          `${website_agent.agent_id || website_agent.full_name} would like to update their site theme to ${capitalizeFirstLetter(
            user_data.website_theme as string,
          )}.`,
        );
      }
    }
    const agent = agent_response?.data?.data?.updateAgent?.data || {};
    const metatags = agent.attributes.agent_metatag.data
      ? {
          ...agent.attributes.agent_metatag.data.attributes,
          id: Number(agent.attributes.agent_metatag.data.id),
        }
      : undefined;

    return {
      ...agent.attributes,
      id: agent.id ? Number(agent.id) : undefined,
      metatags,
      website_build: Object.keys(website_build).length ? website_build : undefined,
    };
  } catch (e) {
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
    } else {
      consoler(
        FILE,
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
    consoler(FILE, 'Error in updateAgentMetatags');
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
    consoler(
      FILE,
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

export async function findAgentRecordByAgentId(agent_id: string) {
  try {
    const response = await findAgentBy({ agent_id });
    return response;
  } catch (e) {
    const { response: axerr } = e as unknown as {
      response?: {
        data?: {
          error?: {
            [k: string]: string;
          };
        };
      };
    };
    console.error(axerr?.data?.error);
    consoler(FILE, 'Error in api.agents.model.findAgentRecordByAgentId:', agent_id);
  }
}
export async function findAgentBrokerageAgents(agent_id: string, exclude_self?: boolean) {
  try {
    const query = {
      query: gql_brokerage_realtors,
      variables: {
        agent_id,
      },
    };
    const { data: response_data } = await axios.post(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, query, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
    });

    if (response_data?.data?.brokerages?.data) {
      const agents: string[] = [];
      response_data?.data?.brokerages?.data.map(({ attributes }: { attributes: { agents: { data: { attributes: { agent_id: string } }[] } } }) => {
        attributes.agents.data.map(a => {
          if (!exclude_self || agent_id !== a.attributes.agent_id) agents.push(a.attributes.agent_id);
        });
      });
      return agents;
    }

    return response_data;
  } catch (e) {
    const { response: axerr } = e as unknown as {
      response?: {
        data?: {
          error?: {
            [k: string]: string;
          };
        };
      };
    };
    consoler(FILE, axerr?.data?.error);
    consoler(FILE, 'Error in api.agents.model.findAgentBrokerageAgents:', agent_id);
  } finally {
    consoler(FILE, 'Completed api.agents.model.findAgentBrokerageAgents call for', agent_id);
  }
}

export async function findAgentRecordByRealtorId(realtor_id: number) {
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
    consoler(FILE, 'findAgentsBy: agent record does not exist', attributes);
    return;
  } else if (!record.attributes.agent_metatag?.data) {
    consoler(FILE, 'No linked agent metatag, try to find one in Agent Metatag collection');

    const { data: response_data } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_metatag_by_agent_id,
        variables: {
          agent_id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    let [metatag] = response_data?.data?.agentMetatags.data;
    if (metatag?.id) {
      await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: mutation_update_agent,
          variables: {
            id: record.id,
            data: {
              agent_metatag: Number(metatag.id),
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
    }

    const recent = await getMostRecentListing(agent_id);

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

export async function getSoldListings(
  agent_id: string,
  size: number = 10,
  sort?: {
    [key: string]: 'asc' | 'desc';
  },
  include_brokerage = true,
): Promise<unknown> {
  const should: {}[] = [
    { match: { 'data.LA1_LoginName': agent_id } },
    { match: { 'data.LA2_LoginName': agent_id } },
    { match: { 'data.LA3_LoginName': agent_id } },
  ];

  if (include_brokerage) {
    const brokerages = await getAgentBrokerages(agent_id);
    if (brokerages?.length) {
      brokerages.forEach(brokerage => {
        should.push({ match: { 'data.LO1_Name': brokerage.name } });
        should.push({ match: { 'data.LO2_Name': brokerage.name } });
        should.push({ match: { 'data.LO3_Name': brokerage.name } });
      });
    }
  }

  const legacy_params: LegacySearchPayload = {
    from: 0,
    size,
    sort,
    query: {
      bool: {
        filter: [{ match: { 'data.Status': 'Sold' } }],
        should,
        minimum_should_match: 1,
        must_not: [{ match: { 'data.Status': 'Terminated' } }],
      },
    },
  };

  const results = await retrieveFromLegacyPipeline(legacy_params, undefined, 1);

  return await Promise.all(results.map(r => strapify(r as unknown as Record<string, unknown>)));
}

export async function strapify(listing: Record<string, unknown>) {
  try {
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
      mls_id,
      floor_area_sqft,
      floor_area,
      lot_sqft,
      year_built,
      listed_at: listing_date,
      state_province,
      postal_zip_code,
      LO1_Name,
      LO2_Name,
      LO3_Name,
      ...mls_data
    } = listing;

    const {
      LA1_FullName,
      LA2_FullName,
      LA3_FullName,
      LandTitle: land_title,
      PricePerSQFT: price_per_sqft,
      L_GrossTaxes: gross_taxes,
    } = mls_data as unknown as MLSProperty;

    const real_estate_board = await getRealEstateBoard(mls_data as unknown as Record<string, string>);
    let listed_by = LA1_FullName || LA2_FullName || LA3_FullName;
    const [cover_photo] = mls_data.photos ? (mls_data.photos as string[]) : [''];

    const brokerages: string[] = [];
    if (LO1_Name) brokerages.push(LO1_Name as string);
    if (LO2_Name) brokerages.push(LO2_Name as string);
    if (LO3_Name) brokerages.push(LO3_Name as string);

    return {
      gross_taxes,
      price_per_sqft,
      title,
      address: title ? capitalizeFirstLetter(`${title}`.toLowerCase()) : '',
      state_province,
      postal_zip_code,
      description,
      lat,
      lon,
      area: target_area,
      city: target_city,
      brokerages,
      UpdateDate: mls_data.UpdateDate,
      asking_price,
      property_type,
      beds,
      baths,
      listed_by,
      year_built,
      mls_id,
      real_estate_board,
      cover_photo,
      lot_sqft: lot_sqft ? lot_sqft && formatValues({ lot_sqft }, 'lot_sqft') + ' sqft' : undefined,
      land_title,
      floor_area_sqft: formatValues(
        {
          floor_area_sqft: floor_area_sqft || floor_area,
        },
        'floor_area_sqft',
      ),
      photos: mls_data.photos || [],
    };
  } catch (e) {
    console.log('Error');
    consoler(FILE, e);
    return listing;
  }
}

export async function getMostRecentListing(
  agent_id: string,
  opts?: {
    size?: number;
    sort?: string;
    filters?: {
      key: string;
      value: string;
    }[];
  },
  only_agent = false,
): Promise<unknown> {
  let minimum_should_match = 1;
  let should: {}[] = [
    { match: { 'data.LA1_LoginName': agent_id } },
    { match: { 'data.LA2_LoginName': agent_id } },
    { match: { 'data.LA3_LoginName': agent_id } },
  ];
  const attach_related_records: string[] = [];
  if (opts?.filters?.length) {
    opts.filters.forEach(filter => {
      // If the item was specifically asked by MLS_ID, we don't need the agent_id
      // filter and we would also need to return:
      //  - other units listed in the same building
      //  - sold history
      if (filter.key === 'mls_id') {
        should = [{ match: { [`data.${filter.key}`]: filter.value } }];
        attach_related_records.push('building_units', 'history');
      } else {
        should.push({ match: { [`data.${filter.key}`]: filter.value } });
        minimum_should_match++;
      }
    });
  } else {
    minimum_should_match++;
    should.push({ match: { 'data.Status': 'Active' } });
  }
  if (only_agent) should.pop();

  const legacy_params: LegacySearchPayload = {
    from: 0,
    size: opts?.size || 1,
    // BUGFIX: Recent listings didn't have this very important sorting filter for Elastic search
    sort:
      opts?.sort && opts.sort.split(':').length === 2
        ? { [`data.${opts.sort.split(':').reverse().pop()}`]: opts.sort.split(':').pop() as 'asc' | 'desc' }
        : {
            'data.ListingDate': 'desc',
          },
    query: {
      bool: {
        should,
        minimum_should_match,
        must_not: [{ match: { 'data.Status': 'Terminated' } }],
      },
    },
  };

  let results = await retrieveFromLegacyPipeline(legacy_params, undefined, 1);
  if (
    !only_agent &&
    (results.length === 0 || results.length < (opts?.size || 1)) &&
    should.filter(expression => {
      const { match } = expression as { match: { 'data.mls_id'?: string } };
      return match['data.mls_id'];
    }).length === 0
  ) {
    const brokerages = await getAgentBrokerages(agent_id);
    let redo = false;
    if (brokerages && brokerages.length) {
      let should: {
        match?: {
          [k: string]: string;
        };
        match_phrase?: {
          [k: string]: string;
        };
      }[] = [];
      redo = true;
      if (opts?.filters?.length) {
        opts.filters.forEach(({ key, value }) => {
          should.push({ match: { [`data.${key}`]: value } });
        });
      } else {
        should.push({ match: { 'data.Status': 'Active' } });
      }
      legacy_params.query.bool = {
        should,
      };
      legacy_params.query.bool.minimum_should_match = 2;

      brokerages.map(brokerage => {
        if (brokerage.name) {
          should = should.concat([
            {
              match_phrase: {
                'data.LO1_Name': brokerage.name,
              },
            },
            {
              match_phrase: {
                'data.LO2_Name': brokerage.name,
              },
            },
            {
              match_phrase: {
                'data.LO3_Name': brokerage.name,
              },
            },
          ]);
        }
      });

      legacy_params.query.bool.should = should;
    }
    if (redo) {
      results = await retrieveFromLegacyPipeline(legacy_params, undefined, 1);
    }
  }

  const listings = await Promise.all(results.map(r => strapify(r as unknown as Record<string, unknown>)));

  if (attach_related_records.length && listings.length === 1) {
    // Only works for single result
    const [listing] = listings;
    if (legacy_params.query.bool && listing.title && listing.state_province && listing.postal_zip_code) {
      if (attach_related_records.includes('history')) {
        // Let's query for sold history
        legacy_params.query.bool.filter = [
          { match: { 'data.Address': listing.title as string } },
          { match: { 'data.Status': 'Sold' } },
          { match_phrase: { 'data.Province_State': listing.state_province as string } },
          { match_phrase: { 'data.PostalCode_Zip': listing.postal_zip_code as string } },
        ];
        delete legacy_params.query.bool.minimum_should_match;
        delete legacy_params.query.bool.should;
        const history = await retrieveFromLegacyPipeline(legacy_params, undefined, 5);

        listings[0] = {
          ...listings[0],
          history: history.map(l => ({
            asking_price: formatValues(l, 'asking_price'),
            sold_price: formatValues(l, 'sold_price'),
            closed_at: formatValues(l, 'closed_at'),
            mls_id: l.mls_id,
            status: l.status,
          })),
        };
      }

      if (attach_related_records.includes('building_units')) {
        // Let's query for other building units
        legacy_params.query.bool.filter = [
          { match: { 'data.Address': listing.title as string } },
          { match: { 'data.Status': 'Active' } },
          { match_phrase: { 'data.Province_State': listing.state_province as string } },
          { match_phrase: { 'data.PostalCode_Zip': listing.postal_zip_code as string } },
        ];
        legacy_params.query.bool.must_not = [{ match: { 'data.MLS_ID': listings[0].mls_id as string } }];
        delete legacy_params.query.bool.minimum_should_match;
        delete legacy_params.query.bool.should;
        const building_units = await retrieveFromLegacyPipeline(legacy_params, undefined, 5);

        listings[0] = {
          ...listings[0],
          building_units: building_units.map(l => ({
            asking_price: formatValues(l, 'asking_price'),

            mls_id: l.mls_id,
            status: l.status,
          })),
        };
      }
    }
  }

  return listings;
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
    consoler(FILE, 'Caught error in createAgentRecordIfNoneFound');
    console.error(e);
  }
}

export async function createAgentRecordIfNoneFound(
  { agent_id, email, phone, full_name, first_name, last_name, street_1, stripe_customer, stripe_subscription, ai_results }: AgentInput,
  real_estate_board?: RealEstateBoardDataModel,
) {
  if (!email) return;
  if (!agent_id) return;

  if (!full_name) return;

  try {
    let agent = await findAgentRecordByAgentId(agent_id);

    const parts = `${full_name.split('PREC*').join('').trim()}`.split(' ');

    if (!agent) {
      consoler(FILE, "Agent not found, let's create it");
      const create_this = {
        agent_id,
        full_name: full_name.split('PREC').join('').trim().split('*').join(''),
        first_name: first_name || parts.pop(),
        last_name: last_name || parts.join(' '),
        // stripe_customer,
        // stripe_subscription,
        phone,
        email,
        street_1,
        real_estate_board_id: real_estate_board?.id || undefined,
      };
      const t = new Date();
      console.log('timestamp', t.toISOString());
      agent = await createAgent(create_this, ai_results);
      console.log('');
      console.log('took', [Date.now() - t.getTime(), 'ms'].join(''));
      console.log('---');
    } else {
      consoler(FILE, `Agent found, let's use ${first_name} ${last_name}`);
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
  return response_data.data?.length
    ? {
        ...response_data.data[0].attributes,
        id: Number(response_data.data[0].id),
      }
    : null;
}

async function addToAgentInventory({ agent_id, agent }: { agent_id: string; agent: number }, property: number) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: mutation_add_to_inventory,
        variables: {
          data: {
            agent_id,
            agent,
            property,
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
    return response;
  } catch (e) {
    console.error('Error in addToAgentInventory');
    console.error(e);
  }
}
