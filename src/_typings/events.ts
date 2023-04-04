export enum Events {
  Login = 'event-login',
  Loading = 'event-loading',
  HomeAlertDismiss = 'event-home-alert-dismiss',
  HomeAlertSuccess = 'event-home-alert-success',
}

export interface EventsData {
  show?: boolean;
  time?: number;
}
