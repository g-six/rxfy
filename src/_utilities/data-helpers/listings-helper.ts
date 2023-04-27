import { Hit } from '@/_typings/pipeline';
import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import {
  combineBalconyData,
  combineDeckData,
  combineDishwasherData,
  combineFenceData,
  combineFireplaceData,
  combineFridgeData,
  combineHVACData,
  combineParkingData,
  combinePatioData,
  combineRoofData,
  combineStorageData,
  combineStoveData,
  combineWasherDryerData,
} from '@/app/api/mls-normaliser';

const keep_as_array = ['Status', 'photos'];

export function getCombinedData({ id, attributes }: { id: number; attributes: PropertyDataModel & { mls_data: MLSProperty } }) {
  const { mls_data, ...cleaned } = attributes;
  let values: PropertyDataModel = cleaned;
  attributes.mls_data &&
    Object.keys(attributes.mls_data).forEach((key: string) => {
      const val = attributes.mls_data[key] as string[];
      values = combineBalconyData(values, key, val);
      values = combineDeckData(values, key, val);
      values = combineDishwasherData(values, key, val);
      values = combineFenceData(values, key, val);
      values = combineFireplaceData(values, key, val);
      values = combineFridgeData(values, key, val);
      values = combineHVACData(values, key, val);
      values = combineParkingData(values, key, val);
      values = combinePatioData(values, key, val);
      values = combineRoofData(values, key, val);
      values = combineStoveData(values, key, val);
      values = combineStorageData(values, key, val);
      values = combineWasherDryerData(values, key, val);
    });
  if (!values.gross_taxes && attributes.mls_data.L_GrossTaxes) {
    const gross_taxes = Number(attributes.mls_data.L_GrossTaxes);
    values.gross_taxes = isNaN(gross_taxes) ? undefined : gross_taxes;
  }
  if (!values.baths) values.baths = Number(attributes.mls_data.L_TotalBaths);
  if (!values.beds) values.beds = Number(attributes.mls_data.L_BedroomTotal || '0');
  if (!values.original_price) values.original_price = Number(attributes.mls_data.OriginalPrice || values.asking_price);
  if (!values.status) values.status = attributes.mls_data.Status as 'Active' | 'Expired' | 'Sold';
  if (!values.area) values.area = attributes.mls_data.Area as string;
  if (!values.city) values.city = attributes.mls_data.City as string;
  if (!values.postal_zip_code) values.postal_zip_code = attributes.mls_data.PostalCode_Zip as string;
  if (!values.lon) values.lon = Number(attributes.mls_data.lng);
  if (!values.year_built) values.year_built = Number(attributes.mls_data.L_YearBuilt);
  if (values.year_built && !values.age) values.age = new Date().getFullYear() - values.year_built;
  if (!values.asking_price && mls_data.AskingPrice) values.asking_price = Number(mls_data.AskingPrice);
  if (!values.price_per_sqft && mls_data.PricePerSQFT) values.price_per_sqft = Number(mls_data.PricePerSQFT);
  if (!values.floor_area && mls_data.L_FloorArea_GrantTotal) {
    values.floor_area = Number(mls_data.L_FloorArea_GrantTotal);
  }
  if (!values.idx_include && mls_data.IdxInclude) {
    values.idx_include = mls_data.IdxInclude === true || mls_data.IdxInclude.toString().toLowerCase() === 'yes';
  }
  if (values.asking_price && values.original_price && values.changes_applied) {
    if (values.asking_price > values.original_price) values.changes_applied = 'Price Increase';
    else if (values.asking_price < values.original_price) values.changes_applied = 'Price Decrease';
  }
  if (!values.tax_year && mls_data.ForTaxYear) {
    values.tax_year = Number(mls_data.ForTaxYear);
  }
  const { real_estate_board } = values as unknown as { real_estate_board: { data?: { id: number } } };
  if (!real_estate_board?.data && mls_data) {
    delete values.real_estate_board;
  }
  if (!values.description && mls_data.L_PublicRemakrs) {
    values.description = mls_data.L_PublicRemakrs;
  }
  if (!values.listed_at && mls_data.ListingDate) {
    const [date, time] = mls_data.ListingDate.split('T');
    const [y, m, d] = date.split('-');
    values.listed_at = new Date(Number(y), Number(m) - 1, Number(d), Number(time.substring(0, 2) || '0')).toISOString().substring(0, 10) as any;
  }
  if (Number(values.age) < 0) values.age = 0;
  if (!values.garage && attributes.mls_data.B_Parking_Type) {
    attributes.mls_data.B_Parking_Type.forEach(parking => {
      if (!values.garage) {
        if (parking.toLowerCase().indexOf('single') >= 0) values.garage = 'Single';
        if (parking.toLowerCase().indexOf('double') >= 0) values.garage = 'Double';
        if (parking.toLowerCase().indexOf('triple') >= 0) values.garage = 'Triple';
      }
    });
    if (!values.garage) values.garage = 'None';
  }
  if (!values.property_type) {
    values.property_type = attributes.mls_data.Type as string;
  }
  return values;
}

export function getSegregatedListings(hits: Hit[]) {
  const active: MLSProperty[] = [];
  const sold: MLSProperty[] = [];
  hits.forEach((hit: Hit) => {
    const { fields } = hit;
    let data: MLSProperty | {} = {};
    Object.keys(fields).forEach(key => {
      const k = key.substring(0, 5) === 'data.' ? key.substring(5) : key;
      data = {
        ...data,
        [k]: Array.isArray(fields[key]) && !keep_as_array.includes(k) ? Array(fields[key]).join(',') : fields[key],
      };
    });
    if ((data as MLSProperty).Status.includes('Active')) {
      active.push(data as MLSProperty);
    } else {
      sold.push(data as MLSProperty);
    }
  });

  return [active, sold];
}

export async function getAgentListings(agent_id: string): Promise<{
  active?: MLSProperty[];
  sold?: MLSProperty[];
}> {
  try {
    // Query cached listings first to save on latency in searching
    let url: string = `https://pages.leagent.com/listings/${agent_id}.json`;
    let res = await fetch(url);
    const content_type = res.headers.get('content-type') as string;
    console.log(res);
    if (!res.ok || content_type.indexOf('/json') === -1) {
      console.log('Cache file not found', content_type, url);
    } else {
      console.log('Cache file for featured listings grid found', url);
    }
    if (res.ok && content_type.indexOf('/json') > 0) {
      const { hits: results } = await res.json();

      const { hits } = results as {
        hits: Hit[];
      };

      const [active, sold] = getSegregatedListings(
        hits.filter(hit => {
          // Just feed publicly listed properties
          return hit._index !== 'private';
        }),
      );

      return {
        active,
        sold,
      };
    } else {
      console.log('Error in getAgentListings subroutine');
      console.log(' There might be no json file cached for listings');
    }
  } catch (e) {
    console.log('Error in getAgentListings subroutine');
    console.log(e);
  }

  return {};
}
