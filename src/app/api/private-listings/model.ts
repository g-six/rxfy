import { PrivateListingInput, PrivateListingOutput, PrivateListingResult } from '@/_typings/private-listing';
import axios, { AxiosError } from 'axios';
import { GQ_FRAG_AGENT } from '../agents/graphql';
import { getFullAgentRecord } from '../_helpers/agent-helper';
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
export async function getPrivateListing(id: number) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_get,
        variables: {
          id,
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
        error: 'GraphQL Error',
        code: 400,
        errors: response.data?.errors.map((error: { message: string; extensions: unknown }) => {
          console.log(JSON.stringify(error.extensions, null, 4));
          return error.message;
        }),
      };
    }
    if (response.data?.data?.listing?.record) {
      let page_url = `/property?lid=${id}`;
      let photos: string[] = [];
      let listing_by = '';
      Object.keys(response.data.data.listing.record.attributes).forEach(key => {
        if (response.data.data.listing.record.attributes[key] === null) response.data.data.listing.record.attributes[key] = '';
        else if (key === 'realtor') {
          const realtor = response.data.data.listing.record.attributes[key].data;
          const agent = getFullAgentRecord(realtor.attributes.agent?.data?.attributes);
          listing_by = `Listing courtesy of ${agent.full_name}`;
          page_url = `${agent.homepage || ''}${page_url}`;
          response.data.data.listing.record.attributes[key] = {
            ...realtor.attributes,
            id: Number(realtor.id),
            agent,
          };
        } else if (key === 'property_photo_album') {
          if (response.data.data.listing.record.attributes[key].data) {
            photos = response.data.data.listing.record.attributes[key].data.attributes.photos;
          } else {
            delete response.data.data.listing.record.attributes[key];
          }
        } else if (response.data.data.listing.record.attributes[key].data) {
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
        page_url,
        photos,
        listing_by,
      };
    } else {
      return {
        error: 'Fail to get record in private-listings/model.getPrivateListing',
        code: 406,
        id,
      };
    }
  } catch (e) {
    const axerr = e as AxiosError;
    console.log(axerr);
    console.log(JSON.stringify(axerr.response?.data || {}, null, 4));
    return {
      error: 'Caught error in private-listings/model.getPrivateListing',
      id,
    };
  }
}
export async function getPrivateListingsByRealtorId(realtor_id: number) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_retrieve,
        variables: {
          realtor_id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data?.data?.listings?.records) {
      return (response.data?.data?.listings?.records as PrivateListingResult[]).map((record: PrivateListingResult) => {
        record.attributes.status = record.attributes.status || 'draft';
        let page_url = `/property?lid=${record.id}`;

        Object.keys(record.attributes).forEach(key => {
          const attributes = record.attributes as unknown as { [key: string]: any };

          if (attributes[key] === null) attributes[key] = undefined;
          else if (attributes[key].data) {
            // This is a relationship link, let's normalize
            if (Array.isArray(attributes[key].data)) {
              attributes[key] = attributes[key].data.map(({ id, attributes }: { id: string; attributes: { [key: string]: unknown } }) => {
                return {
                  ...attributes,
                  id: Number(id),
                };
              });
            } else if (key === 'realtor') {
              const realtor = attributes[key].data;
              if (realtor) {
                const agent = getFullAgentRecord(realtor.attributes.agent?.data?.attributes);
                page_url = `${agent.homepage || ''}${page_url}`;
                delete realtor.attributes.agent;
                attributes[key] = {
                  ...realtor.attributes,
                  id: Number(realtor.id),
                };
                attributes.agent = agent;
              }
            } else {
              attributes[key] = {
                ...attributes[key].data,
                ...attributes[key].data.attributes,
                id: attributes[key].data.id ? Number(attributes[key].data.id) : undefined,
                attributes: undefined,
              };
            }
          } else if (key === 'property_photo_album') {
            if (attributes[key].data) {
              attributes[key] = {
                ...attributes[key].data.attributes,
                id: Number(attributes[key].data.id),
              };
            } else {
              attributes[key] = {};
            }
          }
        });
        return {
          ...record.attributes,
          page_url,
          id: Number(record.id),
        };
      });
    } else {
      return {
        error: 'Fail to retrieve records in private-listings/model.getPrivateListingsByRealtorId',
        code: 406,
        realtor_id,
      };
    }
  } catch (e) {
    const axerr = e as AxiosError;
    console.log(axerr);
    console.log(JSON.stringify(axerr.response?.data || {}, null, 4));
    return {
      error: 'Caught error in private-listings/model.getPrivateListingsByRealtorId',
      realtor_id,
    };
  }
  return {
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
      description
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
      lot_area
      lot_uom
      total_kitchens
      fireplace
      total_fireplaces
      complex_compound_name
      land_title
      total_garage
      total_covered_parking
      total_parking
      total_additional_rooms
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
      total_pets_allowed
      total_cats_allowed
      total_dogs_allowed
      council_approval_required
      building_bylaws
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
      property_photo_album {
          data {
              id
              attributes {
                photos
              }
          }
      }
      restrictions
      realtor {
        data {
          id
          attributes {
            email
            agent {
              data {
                ${GQ_FRAG_AGENT}
              }
            }
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

const gql_get = `query GetPrivateListing($id: ID!) {
  listing: privateListing(id: $id) {
      record: ${GQ_DATA_FRAG_PRIVATE_LISTING}
  }
}`;

const gql_retrieve = `query GetMyPrivateListings($realtor_id: ID!) {
    listings: privateListings(filters: { realtor: { id: { eq: $realtor_id } } }) {
        records: ${GQ_DATA_FRAG_PRIVATE_LISTING}
    }
}`;

const gql_update = `mutation UpdatePrivateListing($id: ID!, $data: PrivateListingInput!) {
    listing: updatePrivateListing(id: $id, data: $data) {
        record: ${GQ_DATA_FRAG_PRIVATE_LISTING}
    }
}`;
