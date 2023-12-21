import { strapify } from '../agents/model';
import { getPipelineData } from '../pipeline/subroutines';
import { buildCacheFiles, getPropertyByMlsId } from '../properties/model';

export async function getDataModelRecord(model: string, filters: { [k: string]: string }) {
  if (model === 'property' && filters.mls_id) {
    const listing = await getListingPipelineData(filters);

    return listing || (await buildCacheFiles(filters.mls_id));
  }
}

async function getListingPipelineData(filters: { [k: string]: string }) {
  const payload = {
    size: 1,
    from: 0,
    query: {
      bool: {
        filter: [
          {
            match: {
              'data.MLS_ID': filters.mls_id,
            },
          },
        ],
      },
    },
  };
  const {
    real_estate_board,
    hits: [
      {
        _source: { data: raw_record },
      },
    ],
    records: [record],
  } = await getPipelineData(payload);

  return {
    ...record,
    real_estate_board,
  };
}
