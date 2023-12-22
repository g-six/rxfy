import { consoler } from '@/_helpers/consoler';
import { PropertyDataModel } from '@/_typings/property';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { getMostRecentListing } from '@/app/api/agents/model';
import { getBuildingUnits, getListingHistory, getPipelineData, mapData } from '@/app/api/pipeline/subroutines';
import { PROPERTY_CONSTRUCTION_STATS, PROPERTY_DIMENSION_STATS, PROPERTY_FINANCIAL_STATS, PROPERTY_INFORMATION_STATS } from '@/app/api/properties/types';
const FILE = 'fetchData.ts';
export default async function fetchData(
  context: string,
  filter: string,
  fallback: unknown,
  opts?: {
    sort?: string;
    size?: number;
    filters?: {
      key: string;
      value: string;
    }[];
  },
) {
  if (fallback) {
    if (context === 'property') {
      if (['recent_listings', 'recent_listing', 'sold'].includes(filter) || filter.split(':').length === 2 || filter.split('=').length === 2) {
        const { agent_id } = fallback as unknown as {
          agent_id: string;
        };
        if (!opts?.filters) {
          // TODO: Refactor to work with other filters
          //        value should be like data-filter="Status:Sold"
          if (filter.includes('recent_listing')) {
            return await getMostRecentListing(agent_id, {
              ...opts,
            });
          } else if (filter === 'sold')
            return await getMostRecentListing(agent_id, {
              ...opts,
              filters: [{ key: 'Status', value: filter }],
            });
          else if (filter.split(':').length === 2) {
            //        value should be like data-filter="Status:Sold"
            const [key, value] = filter.split(':');
            if (key.toLowerCase() === 'mls_id') {
              // Pipeline based page
              const { hits, real_estate_board } = await getPipelineData({
                from: 0,
                size: 1,
                query: {
                  bool: {
                    filter: [
                      {
                        match: {
                          [getPipelineFieldName(key)]: value,
                        },
                      },
                    ],
                  },
                },
              });
              const listings = mapData(hits, real_estate_board);
              let history: PropertyDataModel[] = [];
              let building_units: PropertyDataModel[] = [];
              if (listings?.length) {
                const [{ title, complex_compound_name, state_province, postal_zip_code }] = listings;
                history = await getListingHistory({
                  address: title,
                  state_province,
                  postal_zip_code,
                });

                if (complex_compound_name) {
                  building_units = await getBuildingUnits({
                    mls_id: value,
                    complex_compound_name,
                    state_province,
                    postal_zip_code,
                  });
                }
              }

              const stats = {
                property_information: Object.keys(listings[0])
                  .map(field_name => {
                    if (Object.keys(PROPERTY_INFORMATION_STATS).includes(field_name)) {
                      let value = formatValues(listings[0], field_name);
                      if (Array.isArray(value)) value = value.join(' • ');

                      if (value)
                        return {
                          label: PROPERTY_INFORMATION_STATS[field_name] as string,
                          value,
                        };
                    }
                  })
                  .filter(pair => pair),

                financial_information: Object.keys(listings[0])
                  .map(field_name => {
                    if (Object.keys(PROPERTY_FINANCIAL_STATS).includes(field_name)) {
                      let value = formatValues(listings[0], field_name);
                      if (Array.isArray(value)) value = value.join(' • ');
                      return {
                        label: PROPERTY_FINANCIAL_STATS[field_name] as string,
                        value: formatValues(listings[0], field_name),
                      };
                    }
                  })
                  .filter(pair => pair),

                dimensions: Object.keys(listings[0])
                  .map(field_name => {
                    if (Object.keys(PROPERTY_DIMENSION_STATS).includes(field_name)) {
                      let value = formatValues(listings[0], field_name);
                      if (Array.isArray(value)) value = value.join(' • ');
                      if (value)
                        return {
                          label: PROPERTY_DIMENSION_STATS[field_name] as string,
                          value,
                        };
                      else {
                        consoler(FILE, 'dimensions missing', field_name);
                      }
                    }
                  })
                  .filter(pair => pair),

                construction: Object.keys(listings[0])
                  .map(field_name => {
                    if (Object.keys(PROPERTY_CONSTRUCTION_STATS).includes(field_name)) {
                      let value = formatValues(listings[0], field_name);
                      if (Array.isArray(value)) value = value.join(' • ');
                      return {
                        label: PROPERTY_CONSTRUCTION_STATS[field_name] as string,
                        value,
                      };
                    }
                  })
                  .filter(pair => pair),
              };

              return [
                {
                  ...listings[0],
                  stats,
                  history,
                  building_units,
                },
              ];
            }
            const listings = await getMostRecentListing(agent_id, {
              ...opts,
              filters: [{ key, value }],
            });
            return listings;
          }
        } else {
          // consoler(FILE, { opts });
        }
        return await getMostRecentListing(agent_id, opts);
      }
    }
  }
  return {
    context,
    filter,
  };
}

function getPipelineFieldName(key: string) {
  switch (key.toLowerCase()) {
    case 'mls_id':
      return 'data.MLS_ID';
    default:
      return `data.${capitalizeFirstLetter(key)}`;
  }
}
