import axios from 'axios';

const config = {
  headers: {
    Authorization: `Bearer ${process.env.REACT_APP_TOKEN}`,
  },
};
export const corsProxy = 'https://proxy.setsail.workers.dev/?';

// core functions

export function doGet(url: string, conf: any) {
  conf = conf ? conf : config;
  conf = Object.assign({}, { timeout: 10000 }, conf);
  const useProxy = process.env.NEXT_PUBLIC_USE_PROXY || '0';
  const useProxyInt = parseInt(useProxy);
  url = useProxyInt ? `${corsProxy}${url}` : url;
  return new Promise(resolve => {
    axios
      .get(url, conf)
      .then(result => resolve(result.data))
      .catch(error => {
        console.log('doGet error', error);
        resolve(null);
      });
  });
}

export function loadAddressCoords(address: string) {
  // Here Maps: llu31087@bcaoo.com, Deftones9
  return doGet(`https://geocode.search.hereapi.com/v1/geocode?q=${address}&apiKey=${process.env.NEXT_PUBLIC_HERE_KEY}`, {});
}
