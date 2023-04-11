import { FILTERS } from '../_helpers/constants';
import { must_not, retrieveFromLegacyPipeline } from '@/_utilities/data-helpers/property-page';
import React from 'react';

import { keyCodes, generic } from '../_helpers/constants';
import { loadAddressCoords } from '../_helpers/api';

import { getRouteUsingAgent } from '../_helpers/functions';
import { PropertyStatus } from '@/_typings/property';

type Dataset = {
  [key: string]: any;
};

type SearchPopupResult = {
  newUrl: string;
  ids: number[];
  setIds: React.Dispatch<React.SetStateAction<number[]>>;
  searchInfo: {
    text: string;
    hasResults: boolean;
    isLoading: boolean;
  };
  setSearchInfo: React.Dispatch<
    React.SetStateAction<{
      text: string;
      hasResults: boolean;
      isLoading: boolean;
    }>
  >;
  results: any[];
  callbackSearch: () => void;
};

type UseSearchPopupProps = {
  items: any[];
  handleClose: () => void;
  dataset?: Dataset;
  config?: {
    authorization: string;
    url: string;
  };
};
export function useSearchPopup({ items, handleClose, dataset = {}, config }: UseSearchPopupProps): SearchPopupResult {
  // const savedItems = useSavedItems();
  const [results, setResults] = React.useState<any[]>([]);
  const [searchInfo, setSearchInfo] = React.useState<{
    text: string;
    hasResults: boolean;
    isLoading: boolean;
  }>({
    text: '',
    hasResults: false,
    isLoading: true,
  });
  const [ids, setIds] = React.useState<number[]>([]);

  React.useEffect(() => {
    setSearchInfo({
      ...searchInfo,
      isLoading: !searchInfo.isLoading,
    });
  }, [results]);

  const callbackSearch = React.useCallback(() => {
    let urlId: number | string = 0;
    try {
      const urlObj = new URL(searchInfo.text);
      const urlAddress = searchInfo.text.replace(urlObj.origin, '');
      urlId = !urlObj ? urlId : urlAddress.replace(getRouteUsingAgent(generic.routes.ITEM, {}) + '/', '');
      urlId = parseInt(urlId.toString()) ? urlId : urlAddress.replace(generic.routes.ITEM, '') + '/';
      urlId = parseInt(urlId.toString()) ? parseInt(urlId.toString()) : 0;
    } catch (e) {
      urlId = 0;
    }
    interface ResultInterface {
      [key: string]: any;
      items: LocationInterface[];
    }
    interface LocationInterface {
      mapView: { [key: string]: number };
    }

    loadAddressCoords(searchInfo.text).then((res: unknown): void => {
      const typedRes = res as ResultInterface;
      if (typedRes && typedRes.items && typedRes.items.length) {
        const location = typedRes.items[0];
        const sw = {
          lat: location.mapView.south,
          lng: location.mapView.west,
        };
        const ne = {
          lat: location.mapView.north,
          lng: location.mapView.east,
        };
        const params = {
          sw: sw,
          ne: ne,
          status: PropertyStatus.ACTIVE_INDEX,
          type: 'R',
        };
        const filter: {
          range?: {
            [key: string]: {
              gte?: number;
              lte?: number;
            };
          };
          match?: {
            [key: string]: string;
          };
          terms?: {
            [key: string]: string[];
          };
        }[] = [
          {
            range: {
              'data.lat': {
                gte: sw.lat,
                lte: ne.lat,
              },
            },
          },
          {
            range: {
              'data.lng': {
                gte: sw.lng,
                lte: ne.lng,
              },
            },
          },
          {
            match: {
              'data.Status': 'Active',
            },
          },
        ];
        let sort: {
          [key: string]: 'asc' | 'desc';
        }[] = [{ 'data.ListingDate': 'desc' }];

        const addingFilters = FILTERS.map((f: any) => f.keys)
          .flat()
          .map((key: any) => `data.${key}`);
        retrieveFromLegacyPipeline(
          {
            from: 0,
            size: 100,
            sort,
            fields: [
              'data.Address',
              'data.Area',
              'data.City',
              'data.AskingPrice',
              'data.L_BedroomTotal',
              'data.L_FloorArea_Total',
              'data.L_TotalBaths',
              'data.L_YearBuilt',
              'data.photos',
              'data.Status',
              'data.MLS_ID',
              'data.lat',
              'data.lng',
              ...addingFilters,
            ],
            _source: true,
            query: {
              bool: {
                filter,
                should: [],
                must_not,
              },
            },
          },
          {
            url: config?.url || '',
            headers: { 'Content-Type': 'application/json', Authorization: config?.authorization || '' },
          },
        ).then((properties: any) => {
          // console.log(properties, mapProperties(properties));

          setResults(properties.slice(0, 50));
        });
      } else {
        setResults([]);
      }
    });
    setSearchInfo({ ...searchInfo, isLoading: true });
    // }
  }, [searchInfo]);

  React.useEffect(() => {
    function handleEnterPress(event: KeyboardEvent) {
      if (event && event.keyCode === keyCodes.KEY_ENTER) {
        callbackSearch();
      } else if (event && event.keyCode === keyCodes.KEY_ESC && handleClose) {
        handleClose();
      }
    }
    if (window) {
      window.addEventListener('keyup', handleEnterPress, false);
    }
    return () => {
      if (window) {
        window.removeEventListener('keyup', handleEnterPress, false);
      }
    };
  }, [callbackSearch, handleClose]);

  let idsForUrl: number[] = [];
  if (items?.length > 0) {
    items.forEach((it: { ListingID: number }) => {
      if (!ids.includes(it.ListingID)) {
        idsForUrl.push(it.ListingID);
      }
    });
  }
  idsForUrl = idsForUrl.concat(ids);

  const pathname = !!dataset && typeof window !== 'undefined' ? window?.location?.pathname + '?ids=' : getRouteUsingAgent(generic.routes.COMPARE, {}) + '/';
  const newUrl = pathname + idsForUrl.join(',');

  return {
    newUrl: newUrl,
    ids: ids,
    setIds: setIds,
    searchInfo: searchInfo,
    setSearchInfo: setSearchInfo,
    results: results,
    callbackSearch: callbackSearch,
  };
}
