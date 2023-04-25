import { MLSProperty } from '@/_typings/property';
import { Events, EventsData } from '@/_typings/events';
import { Filter } from '@/_typings/filters_compare';
import { FILTERS } from './constants';
import { tabs } from '@/_typings/saved-homes-tabs';
import { property_features } from '@/_utilities/data-helpers/property-page';
export function getAgentUrlFromName(name: string) {
  const agentSlug = '/' + name.toLowerCase().replace(' ', '-');
  return '/p' + agentSlug;
}

export function getAgentUrlFromSlug(slug: string) {
  return `/p${slug && slug[0] !== '/' ? '/' : ''}${slug}`;
}

export function getRouteUsingAgent(route: string, agent: any) {
  let rootRoute = '';
  if (agent && Object.keys(agent).length) {
    const hostname = typeof window === 'object' && window.location ? window.location.hostname.toLowerCase() : '';
    const urlFromSlug = agent.profile_slug ? getAgentUrlFromSlug(agent.profile_slug) : '';
    const urlFromName = agent.first_name && agent.last_name ? getAgentUrlFromName(agent.first_name + '_' + agent.last_name) : '';
    let agentUrl;
    try {
      const urlObj = new URL(agent.site_url);
      agentUrl = urlObj.hostname ? urlObj.hostname : agent.site_url;
    } catch (e) {
      agentUrl = agent.site_url;
    }
    agentUrl = agentUrl ? agentUrl : '';
    const agentUrlHost = agentUrl.indexOf(':') >= 0 ? agentUrl.substr(0, agentUrl.indexOf(':')) : agentUrl;
    rootRoute += hostname === agentUrlHost ? '' : urlFromSlug ? urlFromSlug : urlFromName;
  }
  return rootRoute + route;
}

export function isNumeric(value: any) {
  return /^-?\d+$/.test(value);
}

export const isArray = (arr: unknown): arr is any[] => Array.isArray(arr);

export function getDefaults(): Filter[] {
  return FILTERS.filter(f => f && f.behaviors && f.behaviors.includes('default'));
}

export const removeClasses = (classNames: string, removeCls: string[]) =>
  classNames
    .split(' ')
    .filter(cls => !removeCls.includes(cls))
    .join(' ');

export const toDataURL = (url: string) =>
  fetch(url)
    .then(response => response.blob())
    .then(
      blob =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            // @ts-ignore
            const data = reader.result.split(',');
            const resp = {
              base64: reader.result,
              content: data[1],
              format: data[0].replace('data:image/', '').replace(';base64', ''),
              dataType: data[0].replace('data:', '').replace(';base64', ''),
            };
            resolve(resp);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }),
    )
    .catch(err => {
      console.log('TODATAURL ERR:', err);
    });

export function splitObject(obj: Record<string, string>) {
  const keys = Object.keys(obj);
  const half = Math.ceil(keys.length / 2);
  const firstObj = <Record<string, string>>{};
  const secondObj = <Record<string, string>>{};

  let i = 0;
  for (const key of keys) {
    const value = obj[key];
    if (i < half) {
      firstObj[key] = value;
    } else {
      secondObj[key] = value;
    }
    i++;
  }

  return { first: firstObj, second: secondObj };
}

export const fireCustomEvent = (data: EventsData = {}, eventName: Events) => {
  document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
};
export const getCurrentTab = (tabsDOMs: Element[]): string => {
  const tabsArray: string[] = Object.values(tabs);
  const currentTabDOM = tabsDOMs.find(child => {
    const hasCurrent = Array.from(child.classList).find(cls => ['w--current'].includes(cls));
    return hasCurrent;
  });

  return currentTabDOM ? Array.from(currentTabDOM.classList).filter(cls => tabsArray.includes(cls))[0] : 'default';
};
export const prepareStats = (stats: { [key: string]: string }, property: MLSProperty | null): { label: string; value: string | number | undefined }[] => {
  if (!property) return [];

  const aggregatedArray = Object.entries(stats).map(([key, label]) => {
    return {
      label: label,
      value: property[key] as string | number | undefined, // Type assertion for property[key]
    };
  });
  return aggregatedArray.filter(item => item?.value);
};
const featureMapping: Record<string, string> = {
  'Air Conditioning': 'air-conditioner',
  'Washer/Dryer': 'washing-machine',
  Refrigerator: 'refrigerator',
  Stove: 'stove',
  Dishwasher: 'dish-washer',
  Concrete: 'concrete',
  Balcony: 'balcony',
  Patio: 'patio',
  Deck: 'deck',
  'Torch On': 'torch',
  'City/Municipal Water': 'city-municipal',
  Park: 'park',
  Storage: 'box',
  'Recreation Nearby': 'park',
};

export const mapFeatures = (property: MLSProperty | null) => {
  const features: Record<string, string> = {};
  if (!property) return {};
  Object.keys(property)
    .filter(key => property_features.includes(key))
    .forEach(key => {
      const feature = (property[key] as string[]).join(', ');
      const lowercaseFeature = feature.toLowerCase();

      Object.keys(featureMapping).forEach(mappingKey => {
        if (lowercaseFeature.indexOf(mappingKey.toLowerCase()) >= 0) {
          features[mappingKey] = featureMapping[mappingKey];
        }
      });
    });

  return features;
};
