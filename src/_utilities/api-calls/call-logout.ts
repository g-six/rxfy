import Cookies from 'js-cookie';
import { setData, unsetData } from '../data-helpers/local-storage-helper';
import { Events } from '@/hooks/useFormEvent';

/**
 * Remove session cookies from the browser
 */
export function clearSessionCookies() {
  Cookies.remove('session_key');
  Cookies.remove('guid');
  Cookies.remove('session_as');
  Cookies.remove('last_activity_at');
  unsetData('viewing_customer');
  unsetData('signup_object');
  unsetData(Events.LovedItem);
}
