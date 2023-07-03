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
  CTA_CONTACT_FORM = 'cta-contact-form',

  // detailed property page
  PROPERTY_PAGE = 'property-body-wrapper',
  PROPERTY_TOP_IMAGES = 'section---top-images',
  PROPERTY_TOP_STATS = 'section---top-stats',
  PROPERTY_BEDS_BATHS = 'section---beds-baths',
  PROPERTY_STATS_W_ICONS = 'stats-level-2',
  PROPERTY_MAPS = 'section---map-n-street-view',
  PROPERTY_IMAGES_COLLECTION = 'property-image-collection',
  PROPERTY_FEATURES = 'div-features-block',
  PROPERTY_SOLD_HISTORY = 'div-sold-history',
  PROPERTY_AGENT = 'little-profile-card',
  PROPERTY_BUILD_HISTORY = 'div-building-units-on-sale',

  DOCUMENTS = 'docs-section',
  FOOTER_SOCIAL_LINKS = 'footer-social-block',
  HEART_ICON = 'heart-on-small-card',
  PROPERTY_CARD = 'property-card',
  ID_PAGE = 'total-id-card',
  PDF_PAGE = 'pdf-wrapper',
  AGENT_ID_INPUT = 'txt-agentid',
  AGENT_MY_LISTINGS = 'my-listings-dashboard',
  AGENT_TOOLS = 'agent-tools',
  PROPERTY_MAIN_ATTRIBUTES = 'bedbath-stat-block',
  SIMILAR_LISTINGS = 'similar-homes-grid',
  HOME_SEARCH_WRAPPER = 'section---search',
  SESSION_WRAPPER = 'sessions-wrapper',
  SESSION_DROPDOWN = 'in-session-dropdown',
  GUEST_DROPDOWN = 'login-signup',
  PROPERTY_PHOTO_WRAPPER = 'property-images-lightbox',
  PROPERTY_PHOTO_ITEM = 'property-carousel-item',

  // Realtor signup
  AI_PROMPT_MODAL = 'ai-prompt-modal',
  AI_PROMPT_MODAL_BLANK = 'ai-prompt-modal-noresult',
  AI_THEME_PANE_1 = '.w-tabs-1-data-w-pane-0 .theme-area',
  AI_THEME_PANE_2 = 'realtor-ai-property-page',
  AGENT_NAME_WRAPPER = 'agent-name',

  // REALTOR CRM
  CRM_AREA_WRAPPER = 'crm-area',
  CRM_CUS_VW_SAVED_HOMES = 'SavedHomes',
  CRM_CUS_VW_HOME_ALERTS = 'HomeAlerts',
  CRM_NAV_WRAPPER = 'crm-nav',
  CRM_NOTES_WRAPPER = 'note-wrapper',
  CRM_PROPERTY_PREVIEW = 'saved-home-detail-panel',
  CRM_COMPARE_WRAPPER = 'customer-view-compare',
  CRM_MAP = 'map-placeholder',
  CRM_NOTES_FORM_WRAPPER = 'new-note-wrapper',
}

export const CRM_PANE_IDS = [WEBFLOW_NODE_SELECTOR.CRM_CUS_VW_SAVED_HOMES, WEBFLOW_NODE_SELECTOR.CRM_CUS_VW_HOME_ALERTS];

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

export enum WEBFLOW_THEME_DOMAINS {
  DEFAULT = 'leagent-webflow-rebuild.webflow.io',
  OSLO = 'oslo-leagent.webflow.io',
  MALTA = 'malta-leagent.webflow.io',
  MALAGA = 'malaga-leagent.webflow.io',
  LISBON = 'lisbon-leagent.webflow.io',
  HAMBURG = 'hamburg-leagent.webflow.io',
}

export enum WEBFLOW_DASHBOARDS {
  REALTOR = 'leagent-website.webflow.io',
  CUSTOMER = 'leagent-webflow-rebuild.webflow.io',
}
