import { PrivateListingInput } from '@/_typings/private-listing';
import axios, { AxiosError } from 'axios';
export async function createPrivateListing(listing: PrivateListingInput, session_hash: string, realtor_id: number) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_create,
        variables: {
          data: {
            ...listing,
            realtor: realtor_id,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (response.data?.errors) {
      return {
        error: 'User input error',
        code: 400,
        errors: response.data?.errors.map((error: { message: string; extensions: unknown }) => {
          console.log(JSON.stringify(error.extensions, null, 4));
          return error.message;
        }),
      };
    }
    if (response.data?.data?.listing?.record) {
      Object.keys(response.data.data.listing.record.attributes).forEach(key => {
        if (response.data.data.listing.record.attributes[key] === null) response.data.data.listing.record.attributes[key] = undefined;
        else if (response.data.data.listing.record.attributes[key].data) {
          // This is a relationship link, let's normalize
          if (Array.isArray(response.data.data.listing.record.attributes[key].data)) {
            response.data.data.listing.record.attributes[key] = response.data.data.listing.record.attributes[key].data.map(
              ({ id, attributes }: { id: string; attributes: { [key: string]: unknown } }) => {
                return {
                  ...attributes,
                  id: Number(id),
                };
              },
            );
          } else {
            response.data.data.listing.record.attributes[key] = {
              ...response.data.data.listing.record.attributes[key].data,
              ...response.data.data.listing.record.attributes[key].data.attributes,
              id: response.data.data.listing.record.attributes[key].data.id ? Number(response.data.data.listing.record.attributes[key].data.id) : undefined,
              attributes: undefined,
            };
          }
        }
      });
      return {
        ...response.data.data.listing.record.attributes,
        id: Number(response.data.data.listing.record.id),
      };
    } else {
      return {
        error: 'Fail to save record in private-listings/model.createPrivateListing',
        code: 406,
        listing,
        realtor_id,
      };
    }
  } catch (e) {
    const axerr = e as AxiosError;
    console.log(axerr);
    console.log(JSON.stringify(axerr.response?.data || {}, null, 4));
    return {
      error: 'Caught error in private-listings/model.createPrivateListing',
      listing,
      realtor_id,
    };
  }
  return {
    listing,
    realtor_id,
  };
}
export async function updatePrivateListing(id: number, listing: PrivateListingInput, session_hash: string, realtor_id: number) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_update,
        variables: {
          id,
          data: listing,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (response.data?.errors) {
      return {
        error: 'User input error',
        code: 400,
        errors: response.data?.errors.map((error: { message: string; extensions: unknown }) => {
          console.log(JSON.stringify(error.extensions, null, 4));
          return error.message;
        }),
      };
    }
    if (response.data?.data?.listing?.record) {
      Object.keys(response.data.data.listing.record.attributes).forEach(key => {
        if (response.data.data.listing.record.attributes[key] === null) response.data.data.listing.record.attributes[key] = undefined;
        else if (response.data.data.listing.record.attributes[key].data) {
          // This is a relationship link, let's normalize
          if (Array.isArray(response.data.data.listing.record.attributes[key].data)) {
            response.data.data.listing.record.attributes[key] = response.data.data.listing.record.attributes[key].data.map(
              ({ id, attributes }: { id: string; attributes: { [key: string]: unknown } }) => {
                return {
                  ...attributes,
                  id: Number(id),
                };
              },
            );
          } else {
            response.data.data.listing.record.attributes[key] = {
              ...response.data.data.listing.record.attributes[key].data,
              ...response.data.data.listing.record.attributes[key].data.attributes,
              id: response.data.data.listing.record.attributes[key].data.id ? Number(response.data.data.listing.record.attributes[key].data.id) : undefined,
              attributes: undefined,
            };
          }
        }
      });
      return {
        ...response.data.data.listing.record.attributes,
        id: Number(response.data.data.listing.record.id),
      };
    } else {
      return {
        error: 'Fail to save record in private-listings/model.createPrivateListing',
        code: 406,
        listing,
        realtor_id,
      };
    }
  } catch (e) {
    const axerr = e as AxiosError;
    console.log(axerr);
    console.log(JSON.stringify(axerr.response?.data || {}, null, 4));
    return {
      error: 'Caught error in private-listings/model.createPrivateListing',
      listing,
      realtor_id,
    };
  }
  return {
    listing,
    realtor_id,
  };
}
const GQ_DATA_FRAG_PRIVATE_LISTING = `data {
    id
    attributes {
      title
      building_unit
      city
      neighbourhood
      area
      lat
      lon
      postal_zip_code
      region
      state_province
      asking_price
      price_per_sqft
      gross_taxes
      tax_year
      baths
      full_baths
      half_baths
      bathroom_details
      beds
      room_details
      roofing
      depth
      year_built
      floor_levels
      floor_area
      floor_area_uom
      floor_area_main
      floor_area_basement
      floor_area_below_main
      floor_area_upper_floors
      floor_area_unfinished
      floor_area_total
      frontage_feet
      frontage_metres
      frontage_uom
      lot_sqm
      lot_sqft
      total_kitchens
      fireplace
      total_fireplaces
      complex_compound_name
      land_title
      garage
      total_covered_parking
      total_parking
      parkings {
          data {
              id
              attributes {
                  name
              }
          }
      }
      amenities {
          data {
              id
              attributes {
                  name
              }
          }
      }
      total_units_in_community
      strata_fee
      total_allowed_rentals
      by_law_restrictions {
          data {
              id
              attributes {
                  is_allowed
                  name
              }
          }
      }
      appliances {
        data {
            id
            attributes {
                name
            }
        }
      }
      allowed_pets {
          data {
              id
              attributes {
                  name
              }
          }
      }
      building_maintenance_items {
          data {
              id
              attributes {
                  name
              }
          }
      }
      connected_services {
          data {
              id
              attributes {
                  name
              }
          }
      }
      construction_information {
          data {
              id
              attributes {
                  name
              }
          }
      }
      dwelling_type {
          data {
              id
              attributes {
                  name
              }
          }
      }
      facilities {
          data {
              id
              attributes {
                  name
              }
          }
      }
      hvacs {
          data {
              id
              attributes {
                  name
              }
          }
      }
      places_of_interest {
          data {
              id
              attributes {
                  name
              }
          }
      } 
    }
  }
`;
const gql_create = `mutation CreatePrivateListing($data: PrivateListingInput!) {
    listing: createPrivateListing(data: $data) {
        record: ${GQ_DATA_FRAG_PRIVATE_LISTING}
    }
}`;
const gql_update = `mutation UpdatePrivateListing($id: ID!, $data: PrivateListingInput!) {
    listing: updatePrivateListing(id: $id, data: $data) {
        record: ${GQ_DATA_FRAG_PRIVATE_LISTING}
    }
}`;
