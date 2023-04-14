import { AgentData } from '@/_typings/agent';
import { AxiosStatic } from 'axios';

export async function getAgentDataFromDomain(domain: string): Promise<AgentData> {
  const axios: AxiosStatic = (await import('axios')).default;
  let data;

  let url = `https://pages.leagent.com/${encodeURIComponent(domain)}/agent-data.json`;

  let xhr = await axios.get(url).catch(() => {
    console.log('\nError in getting', url);
  });

  if (xhr && xhr.data) {
    data = xhr.data;
  } else {
    console.log('\nNo agent-data.json found at', url);
  }

  if (!data || Object.keys(data).length === 0 || !data.agent_id) {
    url = `${process.env.NEXT_APP_INTEGRATIONS_URL}/agent-websites/d/${domain.split('.webflow.io')}`;

    xhr = await axios.get(url).catch(e => {
      console.log(url, 'not found');
    });

    if (xhr) {
      data = xhr.data;
    }
  }

  return data || {};
}
