import { PropertyInput } from '@/_typings/property';
import { NextRequest } from 'next/server';
import { createPrivateListing } from './model';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  try {
    const listing: PropertyInput = payload;
    createPrivateListing(listing, session_key);
  } catch (e) {
    console.log('Error in private-listings.POST');
    console.error(e);
  }
}
