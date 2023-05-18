/**
 * Given a location in latitude and longitude as well as the distance in kilometers,
 * get the min and max lat / lon
 * @param lat
 * @param lon
 * @param distance
 * @returns
 */
export function getLatLonRange(lat: number, lon: number, distance: number): { lat_min: number; lat_max: number; lon_min: number; lon_max: number } {
  const lat_min = lat - distance / 110.574;
  const lat_max = lat + distance / 110.574;
  const lon_min = lon - distance / (111.32 * Math.cos(lat));
  const lon_max = lon + distance / (111.32 * Math.cos(lat));

  return { lat_min, lat_max, lon_min, lon_max };
}
