import BasePropertyPage from '@/app/property/page';

export default async function PropertyPage({ searchParams }: { searchParams: { [k: string]: string } }) {
  return BasePropertyPage({ searchParams });
}
