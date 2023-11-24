import axios from 'axios';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const QRY_PROPERTY_RELATIONSHIPS = `query PropertyRelationships {
    amenities(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
    
    appliances(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
  
    building_styles: buildingStyles(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
  
    build_features: propertyFeatures(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
  
    connected_services: connectedServices(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
  
    types: dwellingTypes(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
  
    facilities(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
  
    heating: heatSources(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
  
    hvac: hvacs(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
  
    items_maintained: buildingMaintenanceItems(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
  
    parking: parkings(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
  
    pets_allowed: pets(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }

    places_of_interest: placesOfInterest(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }

    real_estate_board: realEstateBoards(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
}
`;

export async function getPropertyAttributes() {
  const api_url = `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`;
  if (api_url) {
    const gql_params: {
      query: string;
      variables?: {
        [key: string]: string;
      };
    } = {
      query: QRY_PROPERTY_RELATIONSHIPS,
    };
    const leagent_cms_res = await axios.post(api_url, gql_params, { headers });

    let response = {};
    if (leagent_cms_res.data.data) {
      Object.keys(leagent_cms_res.data.data).forEach(relationship => {
        const existing: { [key: string]: any }[] = [];

        leagent_cms_res.data.data[relationship].records.forEach((record: { id: number; attributes: { name: string } }) => {
          existing.push({
            ...record.attributes,
            id: Number(record.id),
          });
        });

        response = {
          ...response,
          [relationship]: existing,
        };
      });
    }

    return response;
  }
}
