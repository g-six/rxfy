export enum WEBFLOW_NODE_SELECTOR {
  LOGIN = 'login',
  SIGNUP = 'signup',
  RESET_PASSWORD = 'resetPassword',
  UPDATE_PASSWORD = 'updatePassword',
  COMPARE_WRAPPER = 'compare-wrapper',
  MY_ACCOUNT_WRAPPER = 'my-account-wrapper',
  MY_COMPARE_DASHBOARD = 'cd---compare wf-section',
  MY_SAVED_PROPERTIES_DASHBOARD = 'cd---saved wf-section',
  MY_COMPARE_DASHBOARD_LEFT = 'compare-left-bar',
  MY_COMPARE_DASHBOARD_RIGHT = 'compare-right',
  MY_COMPARE_CARD = 'propcompare-card-2',
  MY_HOME_ALERTS = 'home-alerts-section',
  CLIENTS_CARDS = 'clients-cards',
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
  ID_PAGE = 'total-id-card',
  PDF_PAGE = 'pdf-wrapper',
  AGENT_ID_INPUT = 'txt-agentid',
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
