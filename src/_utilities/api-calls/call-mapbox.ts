import axios from 'axios';
import Cookies from 'js-cookie';

export async function getMapData(lng: number, lat: number, q?: string) {
  const data = await axios.get(`/api/map/${lat}/${lng}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  return data;
}
export async function getMapImage(lat: number, lng: number, dimensions = '520x200') {
  const xhr = await fetch(`/api/map/static/${lat}/${lng}/${dimensions}`, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
    },
    next: {
      revalidate: 60 * 60 * 24 * 365, // cache this map image for 1 year
    },
  });
  const data = await xhr.json();
  return data;
}
export async function getReverseGeo(lng: number, lat: number) {
  const data = await axios.get(`/api/map/reverse/${lat}/${lng}`);
  return data;
}
