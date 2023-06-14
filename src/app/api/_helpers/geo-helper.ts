import {
  Client,
  PlaceQueryAutocompletePrediction,
  StructuredFormatting,
  PlaceQueryAutocompleteRequest,
  PlaceDetailsRequest,
} from '@googlemaps/google-maps-services-js';

export async function googlePlaceQuery(query: string) {
  const client = new Client({});
  const place_request: PlaceQueryAutocompleteRequest = {
    params: {
      input: query,
      key: `${process.env.NEXT_APP_GGL_API_KEY}`,
    },
  };

  const results = await client.placeQueryAutocomplete(place_request);

  const suggestions =
    results.data?.predictions.map((prediction: PlaceQueryAutocompletePrediction) => {
      if (prediction.structured_formatting) {
        const { main_text, secondary_text } = prediction.structured_formatting as unknown as StructuredFormatting;
        return {
          suggestion: [main_text, secondary_text].join(', '),
          place_id: prediction.place_id,
        };
      }
    }) || [];

  return suggestions;
}

export async function getFormattedPlaceDetails(place_id: string) {
  const client = new Client({});

  if (place_id) {
    const place_request: PlaceDetailsRequest = {
      params: {
        place_id,
        key: `${process.env.NEXT_APP_GGL_API_KEY}`,
      },
    };
    const results = await client.placeDetails(place_request);
    const { formatted_address, geometry, address_components } = results.data?.result;

    if (formatted_address) {
      const components = formatted_address.split(', ');
      const address_city_state = address_components as { types: string[]; short_name: string }[];
      let area, city, state_province, postal_zip_code, neighbourhood;

      address_city_state.forEach(({ types, short_name }) => {
        if (types.includes('locality') && types.includes('political')) {
          city = short_name;
        }
        if (types.includes('administrative_area_level_2') && types.includes('political')) {
          area = short_name;
        }
        if (types.includes('administrative_area_level_1') && types.includes('political')) {
          state_province = short_name;
        }
        if (types.includes('postal_code')) {
          postal_zip_code = short_name;
        }
        if (types.includes('neighborhood')) {
          neighbourhood = short_name;
        }
      });

      components.pop();
      return {
        ...geometry?.location,
        address: components.join(', '),
        lat: geometry?.location.lat,
        lon: geometry?.location.lng,
        nelat: geometry?.viewport.northeast.lat,
        nelng: geometry?.viewport.northeast.lng,
        swlat: geometry?.viewport.southwest.lat,
        swlng: geometry?.viewport.southwest.lng,
        area,
        city,
        postal_zip_code,
        state_province,
        neighbourhood,
        place_id,
      };
    }
  }
  return {};
}
