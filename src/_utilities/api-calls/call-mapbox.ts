import axios from 'axios';

export async function getMapData(lng: number, lat: number, q?: string) {
  const data = await axios.get(`/api/map/${lat}/${lng}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  return data;
}
export async function getReverseGeo(lng: number, lat: number) {
  const data = await axios.get(`/api/map/reverse/${lat}/${lng}`);
  console.log('getReverseGeo', data);
  return data;
}
