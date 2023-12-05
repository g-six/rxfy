import BaseMapPage from '@/app/map/page';

export default async function MapPage({ searchParams }: { searchParams: { [k: string]: string } }) {
  return BaseMapPage({ searchParams });
}
