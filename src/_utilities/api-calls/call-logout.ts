import Cookies from 'js-cookie';

/**
 * Remove session cookies from the browser
 */
export function clearSessionCookies() {
  Cookies.remove('session_key');
  Cookies.remove('guid');
  Cookies.remove('session_as');
  Cookies.remove('last_activity_at');
}
