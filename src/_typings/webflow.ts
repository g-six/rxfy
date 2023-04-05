export enum WEBFLOW_NODE_SELECTOR {
  LOGIN = 'login',
  SIGNUP = 'signup',
  RESET_PASSWORD = 'resetPassword',
  COMPARE_WRAPPER = 'compare-wrapper',
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
