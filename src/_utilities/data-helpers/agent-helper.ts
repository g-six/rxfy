import { AgentData } from '@/_typings/agent';
import { AxiosStatic } from 'axios';
import { objectToQueryString } from '../url-helper';

export async function getAgentDataFromDomain(domain: string): Promise<AgentData> {
  if (`${process.env.NEXT_APP_LEAGENT_DOMAINS}`.split(',').includes(domain)) {
    return {
      webflow_domain: process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN,
    } as any;
  }
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

export function getVCFBlob(agent: AgentData): Blob {
  return new Blob(
    [
      `BEGIN:VCARD\nVERSION:4.0\nN:${agent.full_name};;\nFN:${agent.full_name}\nORG:${
        agent.metatags?.brokerage_name || agent.full_name
      }\nTITLE:Leagent Realtor\nTEL;TYPE=WORK,VOICE:${agent.phone}\nEMAIL;TYPE=PREF,INTERNET:${agent.email}\nEND:VCARD`,
    ],
    { type: 'text/vcard;charset=utf-8' },
  );
}

export function getAgentPhoto(agent: AgentData) {
  let photo = agent?.metatags?.headshot;
  photo = photo ? photo : agent?.metatags?.profile_image;
  photo = photo ? photo : agent?.metatags?.logo_for_light_bg;
  photo = photo ? photo : agent?.metatags?.logo_for_dark_bg;
  return photo ? photo : '';
}
export function getAgentHomePageUrl(agent: AgentData) {
  const { domain_name } = agent;
  return domain_name ? `https://${domain_name}` : `/${agent.agent_id}/${agent.metatags.profile_slug}`;
}
export function getAgentMapDefaultUrl(agent: AgentData) {
  let url = getAgentHomePageUrl(agent) + '/map';
  if (agent.metatags.geocoding) {
    const { nelat, nelng, swlat, swlng } = agent.metatags.geocoding as unknown as {
      [k: string]: number;
    };
    if (nelat && swlat && nelng && swlng) {
      const lat = `${(nelat + swlat) / 2}`;
      const lng = `${(nelng + swlng) / 2}`;
      url = `${url}?${objectToQueryString({
        ...agent.metatags.geocoding,
        lat,
        lng,
      } as { [key: string]: string })}`;
    } else {
      url = `${url}?nelat=49.34023817805203&nelng=-122.79116520440928&swlat=49.111312957626524&swlng=-123.30807516134138&lat=49.22590814575915&lng=-123.0496201828758&city=Vancouver&zoom=11`;
    }
  }
  return url;
}
