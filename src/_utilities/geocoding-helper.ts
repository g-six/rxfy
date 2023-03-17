import { Geolocation, MapboxBoundaries } from '@/_typings/maps';

export async function getGeocode(
  address: string
): Promise<Geolocation | undefined> {
  const google_results = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.NEXT_APP_GOOGLE_API_KEY}`
  );

  if (google_results.ok) {
    const {
      results: [result],
    } = await google_results.json();
    const geolocation: Geolocation = result;
    return geolocation;
  } else {
    return;
  }
}

export function getCityFromGeolocation(geolocation: Geolocation) {
  let city = '';
  geolocation.address_components.forEach(({ long_name, types }) => {
    if (types.includes('political')) {
      if (types.includes('locality')) {
        city = long_name;
      } else if (
        !city &&
        types.includes('administrative_area_level_2')
      ) {
        city = long_name;
      }
    }
  });

  return city;
}

export function getViewPortParamsFromGeolocation(
  geolocation: Geolocation
): MapboxBoundaries {
  const { northeast, southwest } = geolocation.geometry.viewport;
  return {
    nelat: northeast.lat,
    nelng: northeast.lng,
    swlat: southwest.lat,
    swlng: southwest.lng,
  };
}
