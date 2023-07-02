import { PROPERTY_ASSOCIATION_KEYS, PropertyDataModel } from '@/_typings/property';
import { Events, EventsData } from '@/_typings/events';
import { Filter } from '@/_typings/filters_compare';
import { FILTERS } from './constants';
import { savedHomesTabs } from '@/_typings/saved-homes-tabs';
import { toKebabCase } from '@/_utilities/string-helper';

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
            const arr = reader.result ? (reader.result as string) : '';
            const data = arr.split(',');
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
      console.log('Caught error in _helpers/functions.toDataURL:', err);
    });

export const downloadFromUrl = (url: string, name: string = 'image', ext: string = 'png') => {
  let xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = function () {
    let a = document.createElement('a');
    a.href = window.URL.createObjectURL(xhr.response);
    a.download = name + '.' + ext;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  xhr.open('GET', url);
  xhr.send();
};

const urlToFile = (image: string) => {
  return fetch(image)
    .then(response => response.blob())
    .then(blob => {
      const file = new File([blob], 'image.jpg', { type: blob.type });
      return { ...file, url: image, preview: image };
    });
};

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
  const tabsArray: string[] = Object.values(savedHomesTabs);
  const currentTabDOM = tabsDOMs.find(child => {
    return Array.from(child.classList).find(cls => ['w--current'].includes(cls));
  });
  return currentTabDOM ? Array.from(currentTabDOM.classList).filter(cls => tabsArray.includes(cls))[0] : 'default';
};
export const prepareStats = (
  stats: { [key: string]: string },
  property: PropertyDataModel | null | undefined,
): { label: string; value: string | number | undefined }[] => {
  if (!property) return [];
  const record = property as unknown as { [key: string]: string | number };

  const aggregatedArray = Object.entries(stats).map(([key, label]) => {
    return {
      label: label,
      value: record[key] as string | number | undefined, // Type assertion for property[key]
    };
  });
  return aggregatedArray.filter(item => item?.value);
};
const featureMapping: Record<string, string> = {
  'Air Conditioning': 'air-conditioner',
  'Air Conditioner': 'air-conditioner',
  Electricity: 'electricity',
  'Washer/Dryer': 'washing-machine',
  'In Suite Laundry': 'washing-machine',
  'Natural Gas': 'natural-gas',
  'Washing Machine': 'washing-machine',
  Refrigerator: 'refrigerator',
  Stove: 'stove',
  Dishwasher: 'dish-washer',
  Concrete: 'concrete',
  Balcony: 'balcony',
  Patio: 'patio',
  Deck: 'deck',
  'Torch On': 'torch',
  'City/Municipal Water': 'city-municipal',
  'City/Municipal Water Supply': 'city-municipal',
  'Municipal Water Supply': 'city-municipal',
  Park: 'park',
  Storage: 'box',
  'Recreation Nearby': 'park',
};

export const mapFeatures = (property: PropertyDataModel) => {
  const features: Record<string, string> = {};
  if (!property) return {};

  if (property.amenities?.data) {
    // DataModel
    property.amenities?.data.map(({ attributes: { name } }) => {
      features[name] = featureMapping[name];
    });
  } else if (property.amenities && Array.isArray(property.amenities)) {
    // DataObject
    property.amenities?.map((name: string) => {
      features[name] = featureMapping[name];
    });
  }
  if (property.facilities?.data) {
    property.facilities?.data.map(({ attributes: { name } }) => {
      features[name] = featureMapping[name];
    });
  } else if (property.facilities && Array.isArray(property.facilities)) {
    // DataObject
    property.facilities?.map((name: string) => {
      features[name] = featureMapping[name];
    });
  }
  if (property.connected_services?.data) {
    property.connected_services?.data.map(({ attributes: { name } }) => {
      features[name] = featureMapping[name];
    });
  } else if (property.connected_services && Array.isArray(property.connected_services)) {
    // DataObject
    property.connected_services?.map((name: string) => {
      features[name] = featureMapping[name];
    });
  }
  if (property.items_maintained?.data) {
    property.items_maintained?.data.map(({ attributes: { name } }) => {
      features[name] = featureMapping[name];
    });
  } else if (property.items_maintained && Array.isArray(property.items_maintained)) {
    // DataObject
    property.items_maintained?.map((name: string) => {
      features[name] = featureMapping[name];
    });
  }

  return features;
};

function getIcon(input: string) {
  switch (toKebabCase(input)) {
    case 'central-air-conditioning':
    case 'air-conditioning':
      return {
        'Air Conditioning': 'air-conditioner',
      };
    case 'city-municipal-water-supply':
    case 'city-water-supply':
    case 'municipal-water-supply':
      return {
        'City/Municipal Supplied Water': 'city-municipal',
      };
    case 'flooring-tile':
      return {
        'Tile Flooring': 'hardwood',
      };

    case 'construction-material-wooden-frame':
    case 'construction-material-wood':
      return {
        'Wooden Frame': 'hardwood',
      };

    case 'locker':
      return { Locker: 'box' };

    case 'in-suite-laundry':
    case 'washer':
      return {
        'Washing Machine': 'washing-machine',
      };
    case 'recycling-services':
    case 'trash-removal':
    case 'garbage':
      return {
        'Garbage Disposal': 'disposal',
      };

    default:
      return {};
  }
}
export function getFeatureIcons(property: unknown) {
  let features = {};
  const relationships = property as Record<string, string[]>;
  PROPERTY_ASSOCIATION_KEYS.forEach(relationship => {
    if (relationships[relationship] && Array.isArray(relationships[relationship])) {
      relationships[relationship].map(name => {
        features = {
          ...features,
          ...getIcon(name),
        };
      });
    }
  });

  return features;
}

export const deepEqual = (objA: any, objB: any, map = new WeakMap()) => {
  if (Object.is(objA, objB)) return true;

  if (objA instanceof Date && objB instanceof Date) {
    return objA.getTime() === objB.getTime();
  }
  if (objA instanceof RegExp && objB instanceof RegExp) {
    return objA.toString() === objB.toString();
  }

  objA = objA ? (objA as object) : null;
  objB = objB ? (objB as object) : null;
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  if (map.get(objA) === objB) return true;
  map.set(objA, objB);

  const keysA = Reflect.ownKeys(objA);
  const keysB = Reflect.ownKeys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    if (!Reflect.has(objB, keysA[i]) || !deepEqual(objA[keysA[i]], objB[keysA[i]], map)) {
      return false;
    }
  }
  return true;
};
