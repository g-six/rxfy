import axios from 'axios';

export async function getMapData(lng: number, lat: number) {
  const data = await axios.get(`/api/map/${lat}/${lng}`);
  return data;
}
