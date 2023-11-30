import MapPage from '@/app/map/page';

export default async function Page(p: any) {
  if (p) {
    return await MapPage(p);
  } else return <></>;
}
