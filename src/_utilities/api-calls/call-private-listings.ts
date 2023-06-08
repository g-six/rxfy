import axios from 'axios';
import { PrivateListingInput } from '@/_typings/private-listing';
import Cookies from 'js-cookie';

export async function createPrivateListing(listing: PrivateListingInput) {
  return await axios.post('/api/private-listings', listing, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
      'Content-Type': 'application/json',
    },
  });
}
