import axios, { AxiosError } from 'axios';

export async function createWebsiteScript(input: { script: string; agent_metatag: number; placement: string }) {
  let code = 400;
  let error;

  try {
    const response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_create_website_script,
        variables: {
          input,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return {
      id: Number(response.data.data.id),
      ...response.data.data.attributes,
    };
  } catch (e) {
    const axerr = e as AxiosError;
    if (axerr.response?.status && axerr.response?.statusText) {
      error = axerr.response.statusText;
      code = axerr.response.status;
    }
  }

  return {
    model: 'website-scripts/model',
    message: 'Unable to createWebsiteScript',
    error,
    code,
  };
}

export const GQ_FRAG_WEBSITE_SCRIPT = `        data {
    id
    attributes {
        script
        placement
        agent_metatag {
            data {
                id
            }
        }
    }
}
`;

export const gql_create_website_script = `mutation CreateWebsiteScript($input: WebsiteScriptInput!) {
    createWebsiteScript(data: $input) {
        ${GQ_FRAG_WEBSITE_SCRIPT}
    }
}`;

export const gql_retrieve_website_scripts = `query GetAgentMetaWebsiteScripts($filters: WebsiteScriptFiltersInput!) {
    scripts: websiteScripts(filters: $filters) {
        ${GQ_FRAG_WEBSITE_SCRIPT}
    }
}`;
