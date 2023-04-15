export enum WEBFLOW_NODE_SELECTOR {
  LOGIN = 'login',
  SIGNUP = 'signup',
  RESET_PASSWORD = 'resetPassword',
  UPDATE_PASSWORD = 'updatePassword',
  COMPARE_WRAPPER = 'compare-wrapper',
  MY_ACCOUNT_WRAPPER = 'my-account-wrapper',
  MY_COMPARE_DASHBOARD = 'cd---compare wf-section',
  MY_COMPARE_DASHBOARD_LEFT = 'compare-left-bar',
  USER_MENU_DROPDOWN = 'login-logout-dropdown',
  USER_MENU = 'in-session',
  GUEST_MENU = 'out-session',
  HOME_ALERTS_WRAPPER = 'home-alert---all-screens',
  CONTACT_FORM = 'contact-form-wrapper',
  PROPERTY_TOP_STATS = 'section---top-stats',
  DOCUMENTS = 'docs-section',
  FOOTER_SOCIAL_LINKS = 'footer-social-block',
  HEART_ICON = 'heart-on-small-card',
  PROPERTY_CARD = 'property-card',
}

export interface WebFlow {
  head: {
    props: Record<string, string>;
    code: string;
  };
  body: {
    props: Record<string, string>;
    code: string;
  };
}
