import { Hit } from '@/_typings/pipeline';
import { BathroomDetails, MLSProperty, PropertyDataModel, RoomDetails } from '@/_typings/property';
import {
  combineBalconyData,
  combineComplexCompoundName,
  combineConstructionData,
  combineDeckData,
  combineDishwasherData,
  combineExteriorFinishData,
  combineFenceData,
  combineFireplaceData,
  combineFloorageAreaData,
  combineFoundationSpecsData,
  combineFridgeData,
  combineFrontageData,
  combineGardenLawnData,
  combineHVACData,
  combineOtherAppliancesData,
  combineOtherInformation,
  combineParkingData,
  combinePatioData,
  combineRoofData,
  combineSafetySecurityData,
  combineStorageData,
  combineStoveData,
  combineWasherDryerData,
  setStyleType,
} from '@/app/api/mls-normaliser';
import axios from 'axios';

const keep_as_array = ['Status', 'photos'];

const MAX_NUM_OF_ROOMS = 75;
export function getCombinedData({ id, attributes }: { id?: number; attributes: PropertyDataModel & { mls_data: MLSProperty } }) {
  const { mls_data, ...cleaned } = attributes;
  let values: PropertyDataModel = cleaned;
  attributes.mls_data &&
    Object.keys(attributes.mls_data).forEach((key: string) => {
      const val = attributes.mls_data[key] as string[];
      values = combineBalconyData(values, key, val);
      values = combineComplexCompoundName(values, key, val);
      values = combineConstructionData(values, key, val);
      values = combineDeckData(values, key, val);
      values = combineDishwasherData(values, key, val);
      values = combineExteriorFinishData(values, key, val);
      values = combineFenceData(values, key, val);
      values = combineFloorageAreaData(values, key, val as unknown as string);
      values = combineFrontageData(values, key, val);
      values = combineFoundationSpecsData(values, key, val);
      values = combineFireplaceData(values, key, val);
      values = combineFridgeData(values, key, val);
      values = combineHVACData(values, key, val);
      values = combineGardenLawnData(values, key, val);
      values = combineParkingData(values, key, val);
      values = combinePatioData(values, key, val);
      values = combineRoofData(values, key, val);
      values = combineSafetySecurityData(values, key, val);
      values = combineStoveData(values, key, val);
      values = combineStorageData(values, key, val);
      values = combineWasherDryerData(values, key, val);
      values = combineOtherAppliancesData(values, key, val);
      values = combineOtherInformation(values, key, val);
      values = setStyleType(values, key, val);
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
  if (!values.state_province) values.state_province = attributes.mls_data.Province_State as string;
  if (!values.postal_zip_code) values.postal_zip_code = attributes.mls_data.PostalCode_Zip as string;
  if (!values.lon) values.lon = Number(attributes.mls_data.lng);
  if (!values.lot_sqm && attributes.mls_data.L_LotSize_SqMtrs) values.lot_sqm = Number(attributes.mls_data.L_LotSize_SqMtrs);
  if (!values.year_built) values.year_built = Number(attributes.mls_data.L_YearBuilt);
  if (values.year_built && !values.age) values.age = new Date().getFullYear() - values.year_built;
  if (!values.asking_price && mls_data.AskingPrice) values.asking_price = Number(mls_data.AskingPrice);
  if (!values.price_per_sqft && mls_data.PricePerSQFT) values.price_per_sqft = Number(mls_data.PricePerSQFT);
  if (!values.floor_area && mls_data.L_FloorArea_GrantTotal) {
    values.floor_area = Number(mls_data.L_FloorArea_GrantTotal);
    values.floor_area_uom = 'Feet';
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
    values.listed_at = new Date(Number(y), Number(m) - 1, Number(d), time ? Number(time.substring(0, 2) || '0') : 0).toISOString().substring(0, 10) as any;
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
  if (!values.style_type) {
    values.style_type = Array.isArray(attributes.mls_data.B_Style) ? attributes.mls_data.B_Style.join(', ') : (attributes.mls_data.B_Style as string);
  }
  if (!values.fireplace) {
    let fireplaces = [];
    if (attributes.mls_data.L_FireplacesFeatures) {
      fireplaces.push(
        Array.isArray(attributes.mls_data.L_FireplacesFeatures)
          ? attributes.mls_data.L_FireplacesFeatures.join(', ')
          : (attributes.mls_data.L_FireplacesFeatures as string),
      );
    }
    if (attributes.mls_data.L_Fireplace_Fuel) {
      fireplaces.push(
        Array.isArray(attributes.mls_data.L_Fireplace_Fuel)
          ? attributes.mls_data.L_Fireplace_Fuel.join(', ')
          : (attributes.mls_data.L_Fireplace_Fuel as string),
      );
    }

    values.fireplace = fireplaces.join(', ');
  }
  if (!values.roofing && attributes.mls_data.B_Roof) {
    values.roofing = Array.isArray(attributes.mls_data.B_Roof) ? attributes.mls_data.B_Roof.join(', ') : (attributes.mls_data.B_Roof as string);
  }
  if (!values.residential_type && attributes.mls_data.Type) {
    values.residential_type = attributes.mls_data.Type;
  }
  if (!values.region && attributes.mls_data.L_Region) {
    values.region = attributes.mls_data.L_Region;
  }
  if (!values.land_title && attributes.mls_data.LandTitle) {
    values.land_title = attributes.mls_data.LandTitle;
  }
  if (!values.heating && attributes.mls_data.B_Heating) {
    values.heating = Array.isArray(attributes.mls_data.B_Heating) ? attributes.mls_data.B_Heating.join(', ') : (attributes.mls_data.B_Heating as string);
  }
  if (!values.year_last_renovated && attributes.mls_data.Reno_Year) {
    values.year_last_renovated = Number(attributes.mls_data.Reno_Year);
  }
  if (!values.strata_fee && attributes.mls_data.L_StrataFee) {
    values.strata_fee = Number(attributes.mls_data.L_StrataFee);
  }
  if (!values.frontage_feet && attributes.mls_data.L_Frontage_Feet) {
    values.frontage_feet = Number(attributes.mls_data.L_Frontage_Feet);
  }
  if (!values.subarea_community && attributes.mls_data.L_SubareaCommunity) {
    values.subarea_community = attributes.mls_data.L_SubareaCommunity;
  }
  if (!values.depth && attributes.mls_data.B_Depth) {
    values.depth = Number(attributes.mls_data.B_Depth);
  }

  if (!values.windows) {
    if (attributes.mls_data.L_WindowFeatures) {
      values.windows = Array.isArray(attributes.mls_data.L_WindowFeatures)
        ? attributes.mls_data.L_WindowFeatures.join(', ')
        : (attributes.mls_data.L_WindowFeatures as string);
    }
  }
  if (!values.room_details) {
    const rooms: RoomDetails[] = [];
    for (let num = 1; num <= MAX_NUM_OF_ROOMS; num++) {
      if (attributes.mls_data[`L_Room${num}_Type`]) {
        rooms.push({
          type: (attributes.mls_data[`L_Room${num}_Type`] as string) || '',
          length: (attributes.mls_data[`L_Room${num}_Dimension1`] as string) || '',
          width: (attributes.mls_data[`L_Room${num}_Dimension2`] as string) || '',
          level: (attributes.mls_data[`L_Room${num}_Level`] as string) || '',
        });
      }
    }
    if (attributes.mls_data.L_MainLevelBedrooms) {
      for (let num = 1; num <= Number(attributes.mls_data.L_MainLevelBedrooms); num++) {
        rooms.push({
          type: 'Bedroom',
          length: '',
          width: '',
          level: 'Main',
        });
      }
    }
    if (attributes.mls_data.L_MainLevelKitchens) {
      for (let num = 1; num <= Number(attributes.mls_data.L_MainLevelKitchens); num++) {
        rooms.push({
          type: 'Kitchen',
          length: '',
          width: '',
          level: 'Main',
        });
      }
    }
    if (attributes.mls_data.L_MainLevelKitchens) {
      for (let num = 1; num <= Number(attributes.mls_data.L_MainLevelKitchens); num++) {
        rooms.push({
          type: 'Kitchen',
          length: '',
          width: '',
          level: 'Main',
        });
      }
    }
    ['Second', 'Third', 'Fourth'].forEach(lvl => {
      if (attributes.mls_data[`L_BedroomsCount${lvl}Level`]) {
        for (let num = 1; num <= Number(attributes.mls_data[`L_BedroomsCount${lvl}Level`]); num++) {
          rooms.push({
            type: 'Bedroom',
            length: '',
            width: '',
            level: `${lvl} Level`,
          });
        }
      }
      if (attributes.mls_data[`L_Kitchens${lvl}Level`]) {
        for (let num = 1; num <= Number(attributes.mls_data[`L_Kitchens${lvl}Level`]); num++) {
          rooms.push({
            type: 'Kitchen',
            length: '',
            width: '',
            level: `${lvl} Level`,
          });
        }
      }
    });
    values.room_details = { rooms };
  }
  if (!values.bathroom_details) {
    const rooms: BathroomDetails[] = [];
    for (let num = 1; num <= MAX_NUM_OF_ROOMS; num++) {
      if (attributes.mls_data[`L_Bath${num}_Pcs`]) {
        const ensuite = (attributes.mls_data[`L_Bath${num}_Ensuite`] as string) || 'No';
        rooms.push({
          ensuite,
          pieces:
            (attributes.mls_data[ensuite === 'No' ? `L_Bath${num}_Pcs` : 'L_BathEnsuite_Pcs'] as number) ||
            (attributes.mls_data[`L_Bath${num}_Pcs`] as number) ||
            1,
          level: (attributes.mls_data[`L_Room${num}_Level`] as string) || '',
        });
      }
    }
    if (attributes.mls_data.L_MainLevelBathrooms) {
      for (let num = 1; num <= Number(attributes.mls_data.L_MainLevelBathrooms); num++) {
        rooms.push({
          level: 'Main',
        });
      }
    }
    if (attributes.mls_data.L_BathroomsCountLowerLevel) {
      for (let num = 1; num <= Number(attributes.mls_data.L_BathroomsCountLowerLevel); num++) {
        rooms.push({
          level: 'Lower Level',
        });
      }
    }
    values.bathroom_details = { rooms };
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
    let res = await axios.get(url);
    if (!res.data) {
      console.log('Cache file not found', url);
      const regen_xhr = await axios.get(`https://live-integrations.leagent.com/opensearch/agent-listings/${agent_id}?regen=1`);

      if (regen_xhr.data?.hits) {
        const { hits } = regen_xhr.data?.hits as { hits: Hit[] };
        const [active, sold] = getSegregatedListings(
          hits.filter(hit => {
            // Just feed publicly listed properties
            return hit._index !== 'private';
          }),
        );
        console.log('regen_xhr', hits);

        return {
          active,
          sold,
        };
      }
    } else {
      console.log('Cache file for featured listings grid found', url);
    }

    const { hits: results } = res.data;

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
  } catch (e) {
    console.log('Error in getAgentListings subroutine');
    console.log(e);
  }

  return {};
}
